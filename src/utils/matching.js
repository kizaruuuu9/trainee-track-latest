
const RECOMMENDER_ENGINE_VERSION = '2.4.5-pro';

const RECOMMENDER_WEIGHTS = {
  competency: 0.50, // Hard match on certified skills
  skill: 0.25,      // Soft match on self-declared skills
  interest: 0.15,   // Motivation/cultural fit
  location: 0.10,   // Proximity/convenience
};

const normalizeLooseText = (value = '') => String(value || '').toLowerCase().trim();

const tokenizeText = (value = '') => {
  return normalizeLooseText(value)
    .split(/[\s,/;|]+/)
    .filter(t => t.length > 2);
};

const getIntersectionSize = (setA, setB) => {
  let count = 0;
  for (const item of setA) {
    if (setB.has(item)) count++;
  }
  return count;
};

const buildRecommendationReasons = (signals) => {
  const reasons = [];
  if (signals.competency >= 0.8) reasons.push('Strong match for core program competencies');
  else if (signals.competency >= 0.5) reasons.push('Good alignment with required competencies');

  if (signals.skill >= 0.7) reasons.push('Your skill set closely fits the job requirements');
  if (signals.interest >= 0.7) reasons.push('Aligns perfectly with your career interests');
  if (signals.location >= 0.9) reasons.push('Convenient location based on your address');

  if (reasons.length === 0) reasons.push('Matches based on general industry alignment');
  return reasons;
};

export const computeRecommendationForJob = (trainee, job) => {
  if (!trainee || !job) {
    return {
      matchRate: 0,
      signals: { competency: 0, skill: 0, interest: 0, location: 0 },
      weights: RECOMMENDER_WEIGHTS,
      reasons: ['No matching profile found'],
      engineVersion: RECOMMENDER_ENGINE_VERSION,
    };
  }

  const signals = { competency: 0, skill: 0, interest: 0, location: 0 };
  const activeWeights = { ...RECOMMENDER_WEIGHTS };

  // 1. Competency Signal (Exact match on program requirements)
  const requiredComps = new Set((job.requiredCompetencies || []).map(normalizeLooseText));
  const traineeComps = new Set((trainee.competencies || []).map(normalizeLooseText));
  if (requiredComps.size > 0) {
    signals.competency = getIntersectionSize(requiredComps, traineeComps) / requiredComps.size;
  } else {
    activeWeights.competency = 0;
  }

  // 2. Skill Signal (Loose match on self-declared skills)
  const jobSkillTokens = new Set((job.requiredSkills || []).flatMap(tokenizeText));
  const traineeSkillTokens = new Set((trainee.skills || []).flatMap(s => tokenizeText(typeof s === 'object' ? s.name : s)));
  if (jobSkillTokens.size > 0) {
    signals.skill = getIntersectionSize(jobSkillTokens, traineeSkillTokens) / jobSkillTokens.size;
  } else {
    activeWeights.skill = 0;
  }

  // 3. Interest Signal
  const jobTokens = new Set([...tokenizeText(job.title), ...tokenizeText(job.description)]);
  const interestTokens = new Set((trainee.interests || []).flatMap(tokenizeText));
  if (interestTokens.size > 0) {
    signals.interest = getIntersectionSize(jobTokens, interestTokens) / interestTokens.size;
  } else {
    activeWeights.interest = 0;
  }

  // 4. Location Signal (Heuristic)
  const jobLoc = normalizeLooseText(job.location || '');
  const traineeLoc = normalizeLooseText(trainee.address || '');
  if (jobLoc && traineeLoc) {
    if (jobLoc === traineeLoc) signals.location = 1.0;
    else if (jobLoc.includes(traineeLoc) || traineeLoc.includes(jobLoc)) signals.location = 0.8;
    else signals.location = 0.2;
  } else {
    activeWeights.location = 0;
  }

  const totalWeight = Object.values(activeWeights).reduce((sum, value) => sum + value, 0);
  const normalizedWeights = totalWeight > 0
    ? Object.fromEntries(Object.entries(activeWeights).map(([key, value]) => [key, value / totalWeight]))
    : { ...activeWeights };

  const weightedScore = Object.entries(normalizedWeights).reduce((sum, [key, weight]) => {
    return sum + (weight * (signals[key] || 0));
  }, 0);

  const matchRate = Math.min(100, Math.max(0, Math.round(weightedScore * 100)));

  return {
    matchRate,
    signals,
    weights: normalizedWeights,
    reasons: buildRecommendationReasons(signals),
    engineVersion: RECOMMENDER_ENGINE_VERSION,
  };
};

export const getMatchRate = (trainee, job) => {
  const result = computeRecommendationForJob(trainee, job);
  return result.matchRate;
};

export const getTraineeRecommendedJobs = (trainee, jobPostings) => {
  if (!trainee || !jobPostings) return [];

  const ranked = jobPostings
    .filter(j => j.status === 'Open')
    .map(job => {
      const rec = computeRecommendationForJob(trainee, job);
      return {
        ...job,
        matchRate: rec.matchRate,
        recommendationSignals: rec.signals,
        recommendationWeights: rec.weights,
        recommendationReasons: rec.reasons,
        recommendationEngine: rec.engineVersion,
        recommendationType: 'exploit',
      };
    })
    .sort((a, b) => b.matchRate - a.matchRate);

  if (ranked.length <= 3) return ranked;

  const exploitCount = Math.max(1, Math.ceil(ranked.length * 0.8));
  const exploit = ranked.slice(0, exploitCount);

  const explorePool = ranked
    .slice(exploitCount)
    .sort((a, b) => {
        const dateA = new Date(a.created_at || a.createdAt || a.datePosted || 0).getTime();
        const dateB = new Date(b.created_at || b.createdAt || b.datePosted || 0).getTime();
        return dateB - dateA;
    });

  const explore = explorePool.map(job => ({ ...job, recommendationType: 'explore' }));

  if (explore.length === 0) return exploit;

  const mixed = [];
  let exploreIndex = 0;
  for (let index = 0; index < exploit.length; index += 1) {
    mixed.push(exploit[index]);
    if ((index + 1) % 4 === 0 && exploreIndex < explore.length) {
      mixed.push(explore[exploreIndex]);
      exploreIndex += 1;
    }
  }

  while (exploreIndex < explore.length) {
    mixed.push(explore[exploreIndex]);
    exploreIndex += 1;
  }

  return mixed;
};
