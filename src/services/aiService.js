import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

export const aiService = {
  /**
   * Generates a professional summary based on profile data
   */
  generateSummary: async (profileData) => {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
      const prompt = `
        You are a professional resume writer. Based on the following student profile, 
        write a 2-3 sentence professional summary that highlights their strengths and readiness for the industry.
        
        Name: ${profileData.name}
        Program: ${profileData.program}
        Skills: ${profileData.skills?.join(", ")}
        Experience: ${JSON.stringify(profileData.workExperience)}
        
        Keep it professional, impactful, and concise. Do not use placeholders.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("AI Summary Error:", error);
      throw error;
    }
  },

  /**
   * Enhances a specific work experience description
   */
  enhanceExperience: async (title, company, description) => {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
      const prompt = `
        Rewrite the following work experience description into 3 impactful, action-oriented bullet points 
        suitable for a professional resume. Use strong action verbs.
        
        Role: ${title}
        Company: ${company}
        Original Description: ${description}
        
        Return ONLY the bullet points.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("AI Experience Error:", error);
      throw error;
    }
  },

  /**
   * Suggests additional skills based on program and current skills
   */
  suggestSkills: async (program, currentSkills) => {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
      const prompt = `
        Given a student in the ${program} program with these current skills: ${currentSkills.join(", ")},
        suggest 5 more relevant technical or soft skills they should include in their resume to be more hireable.
        Return ONLY a comma-separated list of skills.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text().split(",").map(s => s.trim());
    } catch (error) {
      console.error("AI Skills Error:", error);
      throw error;
    }
  }
};
