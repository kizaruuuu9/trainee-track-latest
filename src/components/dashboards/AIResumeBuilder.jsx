import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, Download, Sparkles, Plus, Trash2, Edit3, 
  ChevronLeft, Layout, Palette, Type, CheckCircle2, AlertCircle, Loader2, Image as ImageIcon, X, Search 
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import Cropper from 'react-easy-crop';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { aiService } from '../../services/aiService';
import toast from 'react-hot-toast';

const ALL_FONTS = [
  { id: 'Inter, sans-serif', label: 'Inter' },
  { id: 'Roboto, sans-serif', label: 'Roboto' },
  { id: 'Open Sans, sans-serif', label: 'Open Sans' },
  { id: 'Lato, sans-serif', label: 'Lato' },
  { id: 'Montserrat, sans-serif', label: 'Montserrat' },
  { id: 'Poppins, sans-serif', label: 'Poppins' },
  { id: 'Source Sans Pro, sans-serif', label: 'Source Sans Pro' },
  { id: 'Raleway, sans-serif', label: 'Raleway' },
  { id: 'Ubuntu, sans-serif', label: 'Ubuntu' },
  { id: 'Nunito, sans-serif', label: 'Nunito' },
  { id: 'Work Sans, sans-serif', label: 'Work Sans' },
  { id: 'IBM Plex Sans, sans-serif', label: 'IBM Plex Sans' },
  { id: 'Quicksand, sans-serif', label: 'Quicksand' },
  { id: 'Titillium Web, sans-serif', label: 'Titillium Web' },
  { id: 'Merriweather, serif', label: 'Merriweather' },
  { id: 'Lora, serif', label: 'Lora' },
  { id: 'Playfair Display, serif', label: 'Playfair Display' },
  { id: 'PT Serif, serif', label: 'PT Serif' },
  { id: 'Crimson Text, serif', label: 'Crimson Text' },
  { id: 'Libre Baskerville, serif', label: 'Libre Baskerville' },
  { id: 'Noto Serif, serif', label: 'Noto Serif' },
  { id: 'EB Garamond, serif', label: 'EB Garamond' },
  { id: 'Cormorant Garamond, serif', label: 'Cormorant Garamond' },
  { id: 'Arvo, serif', label: 'Arvo' },
  { id: '"Times New Roman", serif', label: 'Times New Roman' },
  { id: 'Georgia, serif', label: 'Georgia' },
  { id: 'Arial, sans-serif', label: 'Arial' }
];

const AIResumeBuilder = ({ trainee, onBack }) => {
  const componentRef = useRef();
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [enhancingIndex, setEnhancingIndex] = useState(null);
  const [isSuggestingSkills, setIsSuggestingSkills] = useState(false);
  const getInitialLimits = () => {
    if (!trainee?.id) return { summary: 2, experience: 2, skills: 1, lastReset: new Date().toDateString() };
    const saved = localStorage.getItem(`ai_limits_${trainee.id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.lastReset === new Date().toDateString()) {
          return parsed;
        }
      } catch (e) { console.error("Error parsing limits", e); }
    }
    const initial = { summary: 2, experience: 2, skills: 1, lastReset: new Date().toDateString() };
    localStorage.setItem(`ai_limits_${trainee.id}`, JSON.stringify(initial));
    return initial;
  };

  const [activeSection, setActiveSection] = useState('summary');
  const [aiLimits, setAiLimits] = useState(getInitialLimits());

  useEffect(() => {
    if (trainee?.id) {
      localStorage.setItem(`ai_limits_${trainee.id}`, JSON.stringify(aiLimits));
    }
  }, [aiLimits, trainee?.id]);
  const [paperPages, setPaperPages] = useState(1);
  const [pageGroups, setPageGroups] = useState([[0,1,2,3,4]]);
  const sectionRefs = useRef([]);
  const [marginMm, setMarginMm] = useState(8);
  const [pageSize, setPageSize] = useState('a4');
  const [newSkill, setNewSkill] = useState('');
  const [fontSearch, setFontSearch] = useState('');

  const PAGE_SIZES = {
    a4:    { widthMm: 210, heightMm: 297, label: 'A4' },
    short: { widthMm: 216, heightMm: 279, label: 'Short Bond' },
    long:  { widthMm: 216, heightMm: 330, label: 'Long Bond' },
  };

  const previewWrapRef = useRef(null);
  const [previewScale, setPreviewScale] = useState(1);

  const PAGE_PX = () => {
    // Get actual CSS pixel height of 297mm at current viewport
    const d = document.createElement('div');
    d.style.cssText = 'position:absolute;visibility:hidden;height:297mm';
    document.body.appendChild(d);
    const h = d.offsetHeight;
    document.body.removeChild(d);
    return h;
  };

  const recalcPages = () => {
    const refs = sectionRefs.current;
    if (!refs || refs.length === 0 || !refs[0]) return;
    const { heightMm } = PAGE_SIZES[pageSize];
    const d = document.createElement('div');
    d.style.cssText = `position:absolute;visibility:hidden;height:${heightMm}mm`;
    document.body.appendChild(d);
    const pagePx = d.offsetHeight;
    document.body.removeChild(d);
    const padPx = pagePx * (marginMm / heightMm);
    const contentPx = pagePx - padPx * 2;

    const groups = [[]];
    let usedPx = 0;
    let page = 0;

    refs.forEach((el, i) => {
      if (!el) return;
      const h = el.offsetHeight + 24;
      if (usedPx + h > contentPx && usedPx > 0) {
        page++;
        groups.push([]);
        usedPx = 0;
      }
      groups[page].push(i);
      usedPx += h;
    });

    setPaperPages(groups.length);
    setPageGroups(groups);
  };

  // Resume Data State — must come before useEffect that depends on it
  const [resumeData, setResumeData] = useState({
    summary: trainee?.summary || '',
    experience: trainee?.workExperience?.map(exp => ({
      ...exp,
      role: exp.role || exp.jobTitle || '',
      company: exp.company || '',
      description: exp.description || '',
      yearFrom: exp.yearFrom || exp.from || '',
      yearTo: exp.yearTo || exp.to || '',
      include: true
    })) || [],
    skills: trainee?.skills || [],
    education: [
      ...(trainee?.educHistory?.map(edu => ({
        school: edu.school || '',
        level: edu.level || '',
        program: edu.program || '',
        yearFrom: edu.yearFrom || edu.from || '',
        yearTo: edu.yearTo || edu.to || '',
        include: true
      })) || []),
      ...(trainee?.trainings?.filter(t => t.status === 'Graduated' || t.status === 'Completed').map(t => ({
        school: 'TESDA Training Center',
        level: 'Vocational - ' + (t.ncLevel || 'NC Level'),
        program: t.program || t.programName || '',
        yearFrom: '',
        yearTo: t.year || 'Completed',
        include: true
      })) || [])
    ],
    themeColor: '#0a66c2',
    template: 'modern',
    photo: null,
    photoPosition: 'right',
    photoShape: 'circle',
    fontFamily: 'Inter, sans-serif'
  });

  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const handleImageUpload = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setImgSrc(reader.result);
        setCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const getCroppedImg = async (imageSrc, pixelCrop) => {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = imageSrc;
    });
    const canvas = document.createElement('canvas');
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(
      image,
      pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
      0, 0, pixelCrop.width, pixelCrop.height
    );
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(URL.createObjectURL(blob));
      }, 'image/jpeg');
    });
  };

  const showCroppedImage = async () => {
    try {
      const croppedImage = await getCroppedImg(imgSrc, croppedAreaPixels);
      setResumeData(prev => ({ ...prev, photo: croppedImage, photoPosition: prev.photoPosition === 'none' ? 'right' : prev.photoPosition }));
      setCropModalOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const timer = setTimeout(recalcPages, 100);
    return () => clearTimeout(timer);
  }, [resumeData, pageSize, marginMm]);

  // Responsive scaling observer
  useEffect(() => {
    if (!previewWrapRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        const wrapWidth = entry.contentRect.width;
        // Determine pixel width of paper
        const d = document.createElement('div');
        d.style.cssText = `position:absolute;visibility:hidden;width:${PAGE_SIZES[pageSize].widthMm}mm`;
        document.body.appendChild(d);
        const paperPxWidth = d.offsetWidth;
        document.body.removeChild(d);
        
        const padding = 40; // 20px on each side
        if (wrapWidth < paperPxWidth + padding) {
          setPreviewScale((wrapWidth - padding) / paperPxWidth);
        } else {
          setPreviewScale(1);
        }
      }
    });
    observer.observe(previewWrapRef.current);
    return () => observer.disconnect();
  }, [pageSize]);


  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `${trainee?.name || 'Trainee'}_Resume`,
  });

  const handleDownloadPDF = async () => {
    const element = componentRef.current;
    if (!element) return;
    
    try {
      // Temporarily show the element to capture it
      // Note: In some setups, the hidden element might not have dimensions.
      // We rely on html2canvas capturing the ref even if it's display: none in CSS if we handle it right,
      // but usually, it's better to capture a clone or ensure it's "visible" but off-screen.
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      });
      
      if (!canvas || canvas.width === 0) {
        throw new Error('Canvas generation failed');
      }
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', pageSize === 'a4' ? 'a4' : [216, pageSize === 'short' ? 279 : 330]);
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      const safeName = (trainee?.name || 'Trainee').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      pdf.save(`${safeName}_resume.pdf`);
    } catch (error) {
      console.error('PDF Generation Error:', error);
    }
  };

  const generateAISummary = async () => {
    if (aiLimits.summary <= 0) return toast.error('Summary AI limit reached.');
    setIsGeneratingSummary(true);
    try {
      const summary = await aiService.generateSummary({
        name: trainee?.name,
        program: trainee?.program,
        skills: resumeData.skills,
        workExperience: resumeData.experience
      });
      setResumeData(prev => ({ ...prev, summary }));
      setAiLimits(prev => ({ ...prev, summary: prev.summary - 1 }));
      toast.success('Professional summary generated!');
    } catch (error) {
      toast.error('Failed to generate summary.');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const enhanceExperience = async (index) => {
    if (aiLimits.experience <= 0) return toast.error('Experience AI limit reached.');
    const exp = resumeData.experience[index];
    if (!exp.description || exp.description.trim() === '') {
      toast.error('Please add a description first to enhance it.');
      return;
    }

    setEnhancingIndex(index);
    try {
      const enhanced = await aiService.enhanceExperience(exp.role, exp.company, exp.description);
      const newExperience = [...resumeData.experience];
      newExperience[index] = { ...exp, description: enhanced };
      setResumeData(prev => ({ ...prev, experience: newExperience }));
      setAiLimits(prev => ({ ...prev, experience: prev.experience - 1 }));
      toast.success('Experience enhanced!');
    } catch (error) {
      toast.error('Failed to enhance experience.');
    } finally {
      setEnhancingIndex(null);
    }
  };

  const handleSuggestSkills = async () => {
    if (aiLimits.skills <= 0) return toast.error('Skills AI limit reached.');
    setIsSuggestingSkills(true);
    try {
      const program = trainee?.program || trainee?.trainings?.[0]?.program || 'General';
      const newSkills = await aiService.suggestSkills(program, resumeData.skills);
      
      const combined = [...new Set([...resumeData.skills, ...newSkills])];
      setResumeData(prev => ({ ...prev, skills: combined }));
      setAiLimits(prev => ({ ...prev, skills: prev.skills - 1 }));
      toast.success('Skills suggested successfully!');
    } catch (error) {
      toast.error('Failed to suggest skills.');
    } finally {
      setIsSuggestingSkills(false);
    }
  };

  // Individual section renderers
  const renderSection = (idx) => {
    const color = resumeData.themeColor;
    const tmpl = resumeData.template || 'modern';
    const isHarvard = tmpl === 'harvard';
    const isMinimalist = tmpl === 'minimalist';
    const isExecutive = tmpl === 'executive';
    const isCreative = tmpl === 'creative';

    const sectionTitleStyle = isHarvard 
      ? { color: color, textTransform: 'uppercase', borderBottom: `1px solid ${color}`, paddingBottom: 4, marginBottom: 12, fontSize: 16, fontFamily: resumeData.fontFamily }
      : isMinimalist
      ? { color: color, textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600, fontSize: 14, marginBottom: 12, fontFamily: resumeData.fontFamily }
      : isExecutive
      ? { color, borderBottom: `2px solid ${color}`, paddingBottom: 4, marginBottom: 12, textTransform: 'uppercase', fontSize: 16, fontFamily: resumeData.fontFamily }
      : isCreative
      ? { backgroundColor: color, color: '#fff', padding: '6px 12px', display: 'inline-block', borderRadius: 4, marginBottom: 16, fontSize: 16, fontFamily: resumeData.fontFamily }
      : { color, fontFamily: resumeData.fontFamily }; // modern default

    const headerStyle = isHarvard
      ? { textAlign: 'center', marginBottom: 24 }
      : isMinimalist
      ? { textAlign: 'left', marginBottom: 24 }
      : isExecutive
      ? { textAlign: 'right', borderRight: `8px solid ${color}`, paddingRight: 24, marginBottom: 24 }
      : isCreative
      ? { backgroundColor: color, color: '#fff', padding: `${marginMm}mm`, margin: `-${marginMm}mm -${marginMm}mm 24px -${marginMm}mm`, textAlign: 'center' }
      : { borderLeft: `8px solid ${color}`, padding: '0 0 20px 24px', marginBottom: 24 }; // modern

    const nameStyle = isHarvard 
      ? { color: color, fontSize: 24, fontWeight: 'normal', textTransform: 'uppercase', marginBottom: 4, fontFamily: resumeData.fontFamily }
      : isCreative
      ? { color: '#fff', fontSize: 32, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 8, fontFamily: resumeData.fontFamily }
      : { color: color, fontSize: 28, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '-0.02em', marginBottom: 6, fontFamily: resumeData.fontFamily };

    switch(idx) {
      case 0: return (
        <header key="header" style={{ ...headerStyle, display: 'flex', flexDirection: resumeData.photoPosition === 'right' ? 'row' : 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ flex: 1, textAlign: headerStyle.textAlign, fontFamily: resumeData.fontFamily }}>
            <h1 style={nameStyle}>{trainee?.name || 'Your Name'}</h1>
            <div style={{ fontSize: 13, color: isCreative ? '#e2e8f0' : '#64748b', fontFamily: resumeData.fontFamily }}>{trainee?.email} | {trainee?.address}</div>
          </div>
          {resumeData.photo && resumeData.photoPosition !== 'none' && (
            <img 
              src={resumeData.photo} 
              alt="Profile" 
              style={{ 
                width: '90px', 
                height: '90px', 
                borderRadius: resumeData.photoShape === 'circle' ? '50%' : '8px', 
                objectFit: 'cover',
                marginLeft: resumeData.photoPosition === 'right' ? '24px' : '0',
                marginRight: resumeData.photoPosition === 'left' ? '24px' : '0'
              }} 
            />
          )}
        </header>
      );
      case 1: return resumeData.summary ? (
        <section key="summary" className="resume-section" style={{ marginBottom: isHarvard ? 16 : 24 }}>
          <h2 style={sectionTitleStyle}>Professional Summary</h2>
          <p style={{ fontFamily: resumeData.fontFamily, fontSize: isHarvard ? 14 : 13, lineHeight: 1.6 }}>
            {resumeData.summary}
          </p>
        </section>
      ) : null;
      case 2: return resumeData.experience.filter(e => e.include).length > 0 ? (
        <section key="exp" className="resume-section" style={{ marginBottom: isHarvard ? 16 : 24 }}>
          <h2 style={sectionTitleStyle}>Work Experience</h2>
          {resumeData.experience.filter(e => e.include).map((exp, i) => (
            <div key={i} className="resume-item" style={{ marginBottom: 16 }}>
              <div className="item-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                <strong style={{ fontSize: isHarvard ? 15 : 14, fontFamily: resumeData.fontFamily, color: color }}>
                  {exp.role} {isHarvard && exp.company && `, ${exp.company}`}
                </strong>
                <span style={{ fontSize: 13, color: color, fontStyle: isHarvard ? 'italic' : 'normal', fontFamily: resumeData.fontFamily, opacity: isHarvard ? 1 : 0.8 }}>
                  {exp.yearFrom || exp.yearTo ? `${exp.yearFrom || '?'} - ${exp.yearTo || 'Present'}` : ''}
                </span>
              </div>
               {!isHarvard && <div style={{ fontSize: 13, color: color, fontWeight: 600, marginBottom: 8, fontFamily: resumeData.fontFamily }}>{exp.company}</div>}
              <div className="item-desc" style={{ fontFamily: resumeData.fontFamily, fontSize: isHarvard ? 14 : 13, paddingLeft: isHarvard ? 16 : 0 }}>
                {exp.description?.split('\n').map((line, j) => (
                  <div key={j} style={{ display: 'flex', marginBottom: 4 }}>
                    {(isHarvard || isExecutive) && <span style={{ marginRight: 8 }}>•</span>}
                    <p style={{ margin: 0 }}>{line}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      ) : null;
      case 3: return resumeData.skills.length > 0 ? (
        <section key="skills" className="resume-section" style={{ marginBottom: isHarvard ? 16 : 24 }}>
          <h2 style={sectionTitleStyle}>Technical Skills</h2>
          {isHarvard ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px 16px', fontFamily: resumeData.fontFamily, fontSize: 14 }}>
              {resumeData.skills.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <span style={{ marginRight: 6 }}>•</span>
                  <span style={{ lineHeight: 1.4 }}>{s}</span>
                </div>
              ))}
            </div>
          ) : isExecutive ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px 16px', fontSize: 13, fontFamily: resumeData.fontFamily }}>
              {resumeData.skills.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <span style={{ marginRight: 8, color: color }}>▪</span>
                  <span style={{ fontWeight: 500, color: color, lineHeight: 1.4, fontFamily: resumeData.fontFamily }}>{s}</span>
                </div>
              ))}
            </div>
          ) : isMinimalist ? (
            <div style={{ fontSize: 13, lineHeight: 1.8, color: color, fontFamily: resumeData.fontFamily }}>
              {resumeData.skills.map((s, i) => (
                <React.Fragment key={i}>
                  <span style={{ fontWeight: 600, fontFamily: resumeData.fontFamily }}>{s}</span>
                  {i < resumeData.skills.length - 1 && <span style={{ margin: '0 8px', color: color, opacity: 0.5 }}>|</span>}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div className="skills-grid">
              {resumeData.skills.map((s, i) => (
                <span key={i} className="skill-pill" style={isCreative ? { backgroundColor: color, color: '#fff', border: 'none' } : {}}>{s}</span>
              ))}
            </div>
          )}
        </section>
      ) : null;
      case 4: return resumeData.education.filter(e => e.include).length > 0 ? (
        <section key="edu" className="resume-section" style={{ marginBottom: isHarvard ? 16 : 24 }}>
          <h2 style={sectionTitleStyle}>Education</h2>
          {resumeData.education.filter(e => e.include).map((edu, i) => (
            <div key={i} className="resume-item" style={{ marginBottom: 12 }}>
              <div className="item-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                <strong style={{ fontSize: isHarvard ? 15 : 14, fontFamily: resumeData.fontFamily, color: color }}>
                  {edu.school}
                </strong>
                <span style={{ fontSize: 13, color: color, fontStyle: isHarvard ? 'italic' : 'normal', fontFamily: resumeData.fontFamily, opacity: isHarvard ? 1 : 0.8 }}>
                  {edu.yearFrom || edu.yearTo ? `${edu.yearFrom || '?'} - ${edu.yearTo || 'Present'}` : ''}
                </span>
              </div>
              <div className="item-desc" style={{ fontFamily: resumeData.fontFamily, fontSize: isHarvard ? 14 : 13 }}>
                <p style={{ margin: 0, fontFamily: resumeData.fontFamily }}>{edu.level} {edu.program ? `— ${edu.program}` : ''}</p>
              </div>
            </div>
          ))}
        </section>
      ) : null;
      default: return null;
    }
  };

  // Print-friendly single-flow content
  const resumeContentJSX = [0,1,2,3,4].map(i => renderSection(i));

  return (
    <div className="ai-resume-builder-overlay">
      <div className="ai-resume-builder-container">
        {/* Header */}
        <div className="ai-resume-header">
          <button onClick={onBack} className="back-btn">
            <ChevronLeft size={20} /> Back to Profile
          </button>
          <div className="header-actions" style={{ display: 'flex', gap: 8 }}>
            <button onClick={handlePrint} className="print-btn" style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              background: 'white',
              color: '#64748b',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer'
            }}>
              <FileText size={18} /> Print
            </button>
            <button onClick={handleDownloadPDF} className="download-btn">
              <Download size={18} /> Download PDF
            </button>
          </div>
        </div>

        <div className="ai-resume-content">
          {/* Left Sidebar - Controls */}
          <div className="ai-resume-controls">
            <div className="control-section">
              <h3><Layout size={16} /> Appearance</h3>

              {/* Template Selection */}
              <p className="ctrl-label">Resume Template</p>
              <div className="template-select-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                {[
                  { id: 'modern', label: 'Modern' },
                  { id: 'harvard', label: 'Harvard (ATS)' },
                  { id: 'minimalist', label: 'Minimalist' },
                  { id: 'executive', label: 'Executive' },
                  { id: 'creative', label: 'Creative' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setResumeData(prev => ({ ...prev, template: t.id }))}
                    className={`template-btn ${resumeData.template === t.id ? 'active' : ''}`}
                    style={{
                      padding: '8px',
                      fontSize: '12px',
                      fontWeight: 600,
                      border: `2px solid ${resumeData.template === t.id ? '#0a66c2' : '#e2e8f0'}`,
                      borderRadius: '8px',
                      background: resumeData.template === t.id ? '#eff6ff' : '#fff',
                      color: resumeData.template === t.id ? '#0a66c2' : '#64748b',
                      cursor: 'pointer'
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Theme Colors */}
              <p className="ctrl-label">Theme Color</p>
              <div className="theme-grid">
                {['#0a66c2', '#166534', '#1e293b', '#7c3aed', '#be123c'].map(color => (
                  <button
                    key={color}
                    onClick={() => setResumeData(prev => ({ ...prev, themeColor: color }))}
                    style={{ backgroundColor: color }}
                    className={`color-dot ${resumeData.themeColor === color ? 'active' : ''}`}
                  />
                ))}
              </div>

              {/* Typography */}
              <p className="ctrl-label" style={{ marginTop: 24, marginBottom: 8 }}>Typography</p>
              <div className="font-search-box" style={{ position: 'relative', marginBottom: 10 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  type="text" 
                  placeholder="Search 30+ professional fonts..." 
                  value={fontSearch}
                  onChange={(e) => setFontSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 8px 8px 32px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div className="font-list-scroll" style={{ 
                maxHeight: '180px', 
                overflowY: 'auto', 
                border: '1px solid #e2e8f0', 
                borderRadius: '8px', 
                padding: 4,
                background: '#fff',
                marginBottom: 20
              }}>
                {ALL_FONTS.filter(f => f.label.toLowerCase().includes(fontSearch.toLowerCase())).map(f => (
                  <button
                    key={f.id}
                    onClick={() => setResumeData(prev => ({ ...prev, fontFamily: f.id }))}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background: resumeData.fontFamily === f.id ? '#eff6ff' : 'transparent',
                      color: resumeData.fontFamily === f.id ? '#0a66c2' : '#475569',
                      fontFamily: f.id,
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 2
                    }}
                  >
                    <span>{f.label}</span>
                    {resumeData.fontFamily === f.id && <CheckCircle2 size={14} />}
                  </button>
                ))}
                {ALL_FONTS.filter(f => f.label.toLowerCase().includes(fontSearch.toLowerCase())).length === 0 && (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                    No fonts found matching "{fontSearch}"
                  </div>
                )}
              </div>

              {/* Page Size */}
              <p className="ctrl-label" style={{ marginTop: 14 }}>Page Size</p>
              <div className="page-size-btns">
                {Object.entries(PAGE_SIZES).map(([key, val]) => (
                  <button
                    key={key}
                    onClick={() => setPageSize(key)}
                    className={`page-size-btn ${pageSize === key ? 'active' : ''}`}
                  >
                    {val.label}
                  </button>
                ))}
              </div>

              {/* Margin Slider */}
              <p className="ctrl-label" style={{ marginTop: 14 }}>
                Margin &nbsp;<strong>{marginMm}mm</strong>
              </p>
              <input
                type="range"
                min={4} max={25} step={1}
                value={marginMm}
                onChange={e => setMarginMm(Number(e.target.value))}
                className="margin-slider"
              />
              <div className="margin-range-labels">
                <span>Narrow (4mm)</span><span>Wide (25mm)</span>
              </div>
            </div>

            <div className="control-section">
              <h3><Edit3 size={16} /> Edit Sections</h3>
              <div className="section-tabs">
                {['photo', 'summary', 'experience', 'skills', 'education'].map(s => (
                  <button 
                    key={s}
                    onClick={() => setActiveSection(s)}
                    className={`section-tab ${activeSection === s ? 'active' : ''}`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>

              <div className="section-editor">
                {activeSection === 'photo' && (
                  <div className="photo-edit-panel">
                    <p className="ctrl-label" style={{ marginBottom: 12, textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.05em', fontWeight: 700, color: '#64748b' }}>Profile Photo</p>
                    <div className="photo-preview-area">
                      {resumeData.photo ? (
                        <div className="photo-present-view">
                          <img 
                            src={resumeData.photo} 
                            alt="Current profile" 
                            className="current-photo-preview" 
                            style={{ borderRadius: resumeData.photoShape === 'circle' ? '50%' : '8px' }}
                          />
                          <div className="photo-actions" style={{ display: 'flex', gap: 32, justifyContent: 'center', marginTop: 16 }}>
                             <label className="photo-action-btn">
                               <ImageIcon size={18} /> Change
                               <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
                             </label>
                             {imgSrc && (
                               <button className="photo-action-btn" onClick={() => setCropModalOpen(true)}>
                                 <Edit3 size={18} /> Adjust
                               </button>
                             )}
                             <button className="photo-action-btn" onClick={() => setResumeData(prev => ({ ...prev, photo: null }))}>
                               <Trash2 size={18} /> Remove
                             </button>
                          </div>
                        </div>
                      ) : (
                        <label className="photo-empty-view">
                          <div className="photo-empty-icon"><ImageIcon size={24} /></div>
                          <span className="photo-empty-title">Click to Upload Photo</span>
                          <p className="photo-empty-desc">Recommended: 1x1 Square</p>
                          <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
                        </label>
                      )}
                    </div>

                    <div className="photo-placement-box">
                      <p className="ctrl-label" style={{ marginTop: 24, marginBottom: 12, textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.05em', fontWeight: 700, color: '#64748b' }}>Header Placement</p>
                      <div className="placement-options">
                        <button
                          onClick={() => setResumeData(prev => ({ ...prev, photoPosition: 'left' }))}
                          className={`placement-btn ${resumeData.photoPosition === 'left' ? 'active' : ''}`}
                        >
                          <div className="placement-icon left-icon"></div> Left Side
                        </button>
                        <button
                          onClick={() => setResumeData(prev => ({ ...prev, photoPosition: 'right' }))}
                          className={`placement-btn ${resumeData.photoPosition === 'right' ? 'active' : ''}`}
                        >
                          <div className="placement-icon right-icon"></div> Right Side
                        </button>
                      </div>
                      
                      <p className="ctrl-label" style={{ marginTop: 24, marginBottom: 12, textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.05em', fontWeight: 700, color: '#64748b' }}>Photo Shape</p>
                      <div className="placement-options">
                        <button
                          onClick={() => setResumeData(prev => ({ ...prev, photoShape: 'circle' }))}
                          className={`placement-btn ${resumeData.photoShape === 'circle' ? 'active' : ''}`}
                        >
                          <div className="shape-icon-circle"></div> Circle
                        </button>
                        <button
                          onClick={() => setResumeData(prev => ({ ...prev, photoShape: 'square' }))}
                          className={`placement-btn ${resumeData.photoShape === 'square' ? 'active' : ''}`}
                        >
                          <div className="shape-icon-square"></div> Square
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {activeSection === 'summary' && (
                  <div className="section-editor-inner">
                    <button 
                      onClick={generateAISummary} 
                      disabled={isGeneratingSummary || aiLimits.summary <= 0}
                      className="ai-action-btn"
                      style={{ marginBottom: 12, width: '100%' }}
                    >
                      {isGeneratingSummary ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                      Generate AI Summary ({aiLimits.summary} left)
                    </button>
                    <textarea 
                      value={resumeData.summary}
                      onChange={(e) => setResumeData(prev => ({ ...prev, summary: e.target.value }))}
                      placeholder="Write a professional summary..."
                      className="resume-textarea"
                    />
                  </div>
                )}

                {activeSection === 'experience' && (
                  <div className="exp-list">
                    {resumeData.experience.map((exp, idx) => (
                      <div key={idx} className={`exp-item-edit ${!exp.include ? 'excluded' : ''}`}>
                        <div className="item-edit-header">
                          <label className="include-toggle">
                            <input 
                              type="checkbox" 
                              checked={exp.include} 
                              onChange={(e) => {
                                const newExp = [...resumeData.experience];
                                newExp[idx].include = e.target.checked;
                                setResumeData(prev => ({ ...prev, experience: newExp }));
                              }}
                            />
                            {exp.include ? 'Included' : 'Excluded'}
                          </label>
                          <button onClick={() => {
                            const newExp = resumeData.experience.filter((_, i) => i !== idx);
                            setResumeData(prev => ({ ...prev, experience: newExp }));
                          }} className="delete-mini-btn"><Trash2 size={12} /></button>
                        </div>
                        <input 
                          value={exp.role} 
                          onChange={(e) => {
                            const newExp = [...resumeData.experience];
                            newExp[idx].role = e.target.value;
                            setResumeData(prev => ({ ...prev, experience: newExp }));
                          }}
                          placeholder="Position / Role"
                        />
                        <input 
                          value={exp.company} 
                          onChange={(e) => {
                            const newExp = [...resumeData.experience];
                            newExp[idx].company = e.target.value;
                            setResumeData(prev => ({ ...prev, experience: newExp }));
                          }}
                          placeholder="Company Name"
                        />
                        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                          <input 
                            value={exp.yearFrom} 
                            onChange={(e) => {
                              const newExp = [...resumeData.experience];
                              newExp[idx].yearFrom = e.target.value;
                              setResumeData(prev => ({ ...prev, experience: newExp }));
                            }}
                            placeholder="Start Date"
                            style={{ margin: 0 }}
                          />
                          <input 
                            value={exp.yearTo} 
                            onChange={(e) => {
                              const newExp = [...resumeData.experience];
                              newExp[idx].yearTo = e.target.value;
                              setResumeData(prev => ({ ...prev, experience: newExp }));
                            }}
                            placeholder="End Date"
                            style={{ margin: 0 }}
                          />
                        </div>
                        <textarea 
                          value={exp.description}
                          onChange={(e) => {
                            const newExp = [...resumeData.experience];
                            newExp[idx].description = e.target.value;
                            setResumeData(prev => ({ ...prev, experience: newExp }));
                          }}
                          placeholder="Description / Duties"
                          style={{ minHeight: 200 }}
                        />
                        <div className="exp-actions-row" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                          <button 
                            onClick={() => enhanceExperience(idx)}
                            disabled={enhancingIndex !== null || isGeneratingSummary || aiLimits.experience <= 0}
                            className="ai-mini-btn"
                          >
                            {enhancingIndex === idx ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                            AI Enhance ({aiLimits.experience})
                          </button>
                        </div>
                      </div>
                    ))}
                    <button className="add-item-btn" onClick={() => setResumeData(prev => ({
                      ...prev,
                      experience: [...prev.experience, { role: '', company: '', yearFrom: '', yearTo: '', description: '', include: true }]
                    }))}>
                      <Plus size={14} /> Add Experience
                    </button>
                  </div>
                )}

                {activeSection === 'education' && (
                  <div className="exp-list">
                    {resumeData.education.map((edu, idx) => (
                      <div key={idx} className={`exp-item-edit ${!edu.include ? 'excluded' : ''}`}>
                        <div className="item-edit-header">
                          <label className="include-toggle">
                            <input 
                              type="checkbox" 
                              checked={edu.include} 
                              onChange={(e) => {
                                const newEdu = [...resumeData.education];
                                newEdu[idx].include = e.target.checked;
                                setResumeData(prev => ({ ...prev, education: newEdu }));
                              }}
                            />
                            {edu.include ? 'Included' : 'Excluded'}
                          </label>
                          <button onClick={() => {
                            const newEdu = resumeData.education.filter((_, i) => i !== idx);
                            setResumeData(prev => ({ ...prev, education: newEdu }));
                          }} className="delete-mini-btn"><Trash2 size={12} /></button>
                        </div>
                        <input 
                          value={edu.school} 
                          onChange={(e) => {
                            const newEdu = [...resumeData.education];
                            newEdu[idx].school = e.target.value;
                            setResumeData(prev => ({ ...prev, education: newEdu }));
                          }}
                          placeholder="School / University"
                        />
                        <input 
                          value={edu.level} 
                          onChange={(e) => {
                            const newEdu = [...resumeData.education];
                            newEdu[idx].level = e.target.value;
                            setResumeData(prev => ({ ...prev, education: newEdu }));
                          }}
                          placeholder="Education Level"
                        />
                        <input 
                          value={edu.program} 
                          onChange={(e) => {
                            const newEdu = [...resumeData.education];
                            newEdu[idx].program = e.target.value;
                            setResumeData(prev => ({ ...prev, education: newEdu }));
                          }}
                          placeholder="Program / Course Taken"
                        />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input 
                            value={edu.yearFrom} 
                            onChange={(e) => {
                              const newEdu = [...resumeData.education];
                              newEdu[idx].yearFrom = e.target.value;
                              setResumeData(prev => ({ ...prev, education: newEdu }));
                            }}
                            placeholder="Year From"
                            style={{ margin: 0 }}
                          />
                          <input 
                            value={edu.yearTo} 
                            onChange={(e) => {
                              const newEdu = [...resumeData.education];
                              newEdu[idx].yearTo = e.target.value;
                              setResumeData(prev => ({ ...prev, education: newEdu }));
                            }}
                            placeholder="Year To"
                            style={{ margin: 0 }}
                          />
                        </div>
                      </div>
                    ))}
                    <button className="add-item-btn" onClick={() => setResumeData(prev => ({
                      ...prev,
                      education: [...prev.education, { school: '', level: '', program: '', yearFrom: '', yearTo: '', include: true }]
                    }))}>
                      <Plus size={14} /> Add Education
                    </button>
                  </div>
                )}

                {activeSection === 'skills' && (
                  <div className="skills-edit-panel">
                    <button 
                      onClick={handleSuggestSkills} 
                      disabled={isSuggestingSkills || aiLimits.skills <= 0}
                      className="ai-action-btn"
                      style={{ width: '100%', marginBottom: 8 }}
                    >
                      {isSuggestingSkills ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                      Suggest Skills via AI ({aiLimits.skills} left)
                    </button>

                    {/* Header with count */}
                    <div className="skills-panel-header">
                      <span className="skills-panel-title">Your Skills</span>
                      <span className="skills-count-badge">{resumeData.skills.filter(s => s).length}</span>
                    </div>

                    {/* Skill bubbles grid */}
                    <div className="skill-bubbles">
                      {resumeData.skills.filter(s => s).map((skill, idx) => (
                        <span key={idx} className="skill-bubble-edit">
                          {skill}
                          <button
                            className="skill-remove-btn"
                            title="Remove skill"
                            onClick={() => setResumeData(prev => ({
                              ...prev,
                              skills: prev.skills.filter((_, i) => i !== idx)
                            }))}
                          >×</button>
                        </span>
                      ))}
                      {resumeData.skills.filter(s => s).length === 0 && (
                        <div className="skills-empty-state">
                          <span>✦</span>
                          <p>No skills added yet</p>
                        </div>
                      )}
                    </div>

                    {/* Add skill input — integrated button inside field */}
                    <div className="skill-add-field">
                      <input
                        className="skill-add-input"
                        value={newSkill}
                        onChange={e => setNewSkill(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && newSkill.trim()) {
                            setResumeData(prev => ({ ...prev, skills: [...prev.skills, newSkill.trim()] }));
                            setNewSkill('');
                          }
                        }}
                        placeholder="Add a skill…"
                      />
                      <button
                        className="skill-add-inline-btn"
                        disabled={!newSkill.trim()}
                        onClick={() => {
                          if (newSkill.trim()) {
                            setResumeData(prev => ({ ...prev, skills: [...prev.skills, newSkill.trim()] }));
                            setNewSkill('');
                          }
                        }}
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                    <p className="skill-add-hint">Press <kbd>Enter</kbd> or click <strong>+</strong> to add</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="ai-resume-preview-wrap" ref={previewWrapRef}>
            {/* Hidden measurement divs - one per section */}
            <div style={{ position: 'absolute', left: '-9999px', width: '180mm', visibility: 'hidden' }}>
              {[0,1,2,3,4].map(i => (
                <div key={i} ref={el => sectionRefs.current[i] = el}>
                  {renderSection(i)}
                </div>
              ))}
            </div>

            {/* Hidden print-only single flow */}
            <div ref={componentRef} className="print-only-resume" style={{ 
              fontFamily: resumeData.fontFamily,
              width: `${PAGE_SIZES[pageSize].widthMm}mm`,
              padding: `${marginMm}mm`,
              background: 'white'
            }}>
              {resumeContentJSX}
            </div>

            {/* Visible: physically separated page sheets */}
            <div 
              className="pages-stack"
              style={{ 
                transform: `scale(${previewScale})`,
                transformOrigin: 'top center',
                marginBottom: `${(previewScale - 1) * PAGE_SIZES[pageSize].heightMm}mm` 
              }}
            >
              {pageGroups.map((group, pageIdx) => (
                <div
                  key={pageIdx}
                  className="page-sheet"
                  style={{
                    width: `${PAGE_SIZES[pageSize].widthMm}mm`,
                    minHeight: `${PAGE_SIZES[pageSize].heightMm}mm`,
                  }}
                >
                  <div className="page-content" style={{ padding: `${marginMm}mm`, fontFamily: resumeData.fontFamily }}>
                    {group.map(sIdx => renderSection(sIdx))}
                  </div>
                  <div className="page-num-outside">Page {pageIdx + 1} / {pageGroups.length} · {PAGE_SIZES[pageSize].label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .ai-resume-builder-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: #f8fafc;
          z-index: 10000;
          display: flex;
          flex-direction: column;
        }

        .ai-resume-builder-container {
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .ai-resume-header {
          padding: 16px 24px;
          background: white;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .back-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          color: #64748b;
          font-weight: 600;
          cursor: pointer;
        }

        .download-btn {
          background: #0a66c2;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(10, 102, 194, 0.2);
        }

        .ai-resume-content {
          flex: 1;
          display: grid;
          grid-template-columns: 380px 1fr;
          overflow: hidden;
        }

        .ai-resume-controls {
          background: white;
          border-right: 1px solid #e2e8f0;
          padding: 24px;
          overflow-y: auto;
        }

        .control-section {
          margin-bottom: 32px;
        }

        .control-section h3 {
          font-size: 14px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .ai-action-btn {
          width: 100%;
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
          color: white;
          border: none;
          padding: 12px;
          border-radius: 8px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: transform 0.2s, opacity 0.2s;
        }

        .ai-action-btn:hover:not(:disabled) {
          transform: translateY(-2px);
        }

        .ai-action-btn:disabled {
          background: #cbd5e1;
          cursor: not-allowed;
          opacity: 0.7;
        }

        .theme-grid {
          display: flex;
          gap: 12px;
        }

        .color-dot {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid transparent;
          cursor: pointer;
        }

        .color-dot.active {
          border-color: #cbd5e1;
          transform: scale(1.2);
        }

        .section-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .section-tab {
          padding: 6px 12px;
          border-radius: 6px;
          background: #f1f5f9;
          border: none;
          font-size: 13px;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
        }

        .section-tab.active {
          background: #0a66c2;
          color: white;
        }

        .resume-textarea {
          width: 100%;
          min-height: 200px;
          padding: 12px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-family: inherit;
          font-size: 14px;
          resize: vertical;
          box-sizing: border-box;
          display: block;
        }

        .exp-item-edit {
          background: #f8fafc;
          padding: 16px;
          border-radius: 12px;
          margin-bottom: 16px;
          border: 1px solid #e2e8f0;
          transition: opacity 0.2s;
        }

        .exp-item-edit.excluded {
          opacity: 0.5;
          background: #f1f5f9;
        }

        .item-edit-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .include-toggle {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          cursor: pointer;
        }

        .ai-mini-btn {
          background: #ede9fe;
          color: #7c3aed;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .ai-mini-btn:hover:not(:disabled) {
          background: #ddd6fe;
        }

        .ai-mini-btn:disabled {
          background: #f1f5f9;
          color: #94a3b8;
          cursor: not-allowed;
        }

        .delete-mini-btn {
          background: #fee2e2;
          color: #ef4444;
          border: none;
          width: 24px;
          height: 24px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .add-item-btn {
          width: 100%;
          padding: 12px;
          background: white;
          border: 2px dashed #e2e8f0;
          border-radius: 8px;
          color: #64748b;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          margin-bottom: 24px;
        }

        .add-item-btn:hover {
          border-color: #0a66c2;
          color: #0a66c2;
          background: #f0f9ff;
        }

        .exp-item-edit input, .exp-item-edit textarea {
          width: 100%;
          margin-bottom: 8px;
          padding: 10px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 13.5px;
          box-sizing: border-box;
          display: block;
        }

        .ai-mini-btn {
          background: #ede9fe;
          color: #7c3aed;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
        }

        .ai-resume-preview-wrap {
          padding: 60px;
          background: #f8fafc;
          overflow-y: auto;
          display: flex;
          justify-content: center;
          align-items: flex-start;
        }

        /* Hidden print version - single continuous flow */
        .print-only-resume {
          position: absolute;
          left: -9999px;
          width: 210mm;
          padding: 15mm;
          box-sizing: border-box;
          background: white;
          color: #1e293b;
        }

        /* Hidden measurement div */
        .measure-resume {
          position: absolute;
          visibility: hidden;
          pointer-events: none;
          width: calc(210mm - 30mm); /* content width = page - left/right padding */
          box-sizing: border-box;
        }

        /* Hidden print version */
        .print-only-resume {
          position: absolute;
          left: -9999px;
          width: 210mm;
          padding: 15mm;
          box-sizing: border-box;
          background: white;
          color: #1e293b;
        }

        /* Stacked separate pages */
        .pages-stack {
          display: flex;
          flex-direction: column;
          gap: 24px;
          align-items: flex-start;
        }

        .page-sheet {
          width: 210mm;
          min-height: 297mm;
          background: white;
          box-shadow: 0 2px 16px rgba(0,0,0,0.10);
          border: 1px solid #e2e8f0;
          box-sizing: border-box;
          position: relative;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .page-content {
          flex: 1;
        }

        .ctrl-label {
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0 0 8px 0;
        }

        .page-size-btns {
          display: flex;
          gap: 8px;
        }

        .page-size-btn {
          flex: 1;
          padding: 7px 10px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          background: white;
          font-size: 12px;
          font-weight: 700;
          color: #64748b;
          cursor: pointer;
          transition: all 0.15s;
        }

        .page-size-btn.active {
          border-color: #0a66c2;
          color: #0a66c2;
          background: #eff6ff;
        }

        .margin-slider {
          width: 100%;
          accent-color: #0a66c2;
          cursor: pointer;
        }

        .margin-range-labels {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: #94a3b8;
          margin-top: 2px;
        }

        .skills-edit-panel {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .skills-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .skills-panel-title {
          font-size: 12px;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .skills-count-badge {
          background: #0a66c2;
          color: white;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 999px;
          min-width: 22px;
          text-align: center;
        }

        .skill-bubbles {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          padding: 12px;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          min-height: 56px;
          align-content: flex-start;
        }

        .skill-bubble-edit {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 5px 12px;
          background: linear-gradient(135deg, #eff6ff, #dbeafe);
          border: 1px solid #93c5fd;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          color: #1e40af;
          transition: all 0.15s;
        }

        .skill-bubble-edit:hover {
          background: linear-gradient(135deg, #dbeafe, #bfdbfe);
          border-color: #60a5fa;
        }

        .skill-remove-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #93c5fd;
          font-size: 16px;
          line-height: 1;
          padding: 0;
          display: flex;
          align-items: center;
          transition: color 0.15s, transform 0.1s;
        }

        .skill-remove-btn:hover {
          color: #ef4444;
          transform: scale(1.2);
        }

        .skills-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          padding: 8px 0;
          gap: 4px;
          color: #cbd5e1;
        }

        .skills-empty-state span { font-size: 18px; }
        .skills-empty-state p { font-size: 12px; margin: 0; color: #94a3b8; }

        .skill-add-field {
          display: flex;
          align-items: center;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          overflow: hidden;
          background: white;
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        .skill-add-field:focus-within {
          border-color: #0a66c2;
          box-shadow: 0 0 0 3px rgba(10,102,194,0.12);
        }

        .skill-add-input {
          flex: 1;
          padding: 9px 12px;
          border: none;
          font-size: 13px;
          outline: none;
          background: transparent;
          color: #1e293b;
        }

        .skill-add-inline-btn {
          padding: 8px 12px;
          background: #0a66c2;
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s;
        }

        .skill-add-inline-btn:hover:not(:disabled) { background: #0958a8; }
        .skill-add-inline-btn:disabled { background: #cbd5e1; cursor: not-allowed; }

        .skill-add-hint {
          font-size: 11px;
          color: #94a3b8;
          margin: 0;
          text-align: center;
        }

        .skill-add-hint kbd {
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          padding: 0 5px;
          font-size: 10px;
          font-family: monospace;
          color: #475569;
        }

        .page-num-outside {
          position: absolute;
          bottom: -22px;
          right: 0;
          font-size: 10px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .page-sheet h1 {
          font-size: 32px;
          font-weight: 800;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: -0.02em;
        }

        .contact-info {
          font-size: 13px;
          color: #64748b;
        }

        .resume-section {
          margin-bottom: 24px;
          page-break-inside: avoid; /* Prevent sections from splitting across pages */
        }

        .resume-section h2 {
          font-size: 14px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 8px;
          margin-bottom: 12px;
        }

        .resume-section p {
          font-size: 13px;
          line-height: 1.6;
          color: #334155;
          word-break: break-word;
          overflow-wrap: break-word;
        }

        .resume-item {
          margin-bottom: 16px;
          page-break-inside: avoid; /* Prevent individual items from splitting across pages */
        }

        .item-header {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          margin-bottom: 4px;
        }

        /* Photo Editor UI Enhancements */
        .photo-edit-panel {
          background: #f8fafc;
          border-radius: 12px;
          padding: 16px;
          border: 1px solid #e2e8f0;
        }

        .photo-preview-area {
          background: white;
          border-radius: 8px;
          border: 2px dashed #cbd5e1;
          padding: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: border-color 0.2s;
        }

        .photo-preview-area:hover {
          border-color: #94a3b8;
        }

        .photo-empty-view {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          cursor: pointer;
          width: 100%;
        }

        .photo-empty-icon {
          background: #f1f5f9;
          width: 48px; height: 48px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: #94a3b8;
          margin-bottom: 12px;
        }

        .photo-empty-title {
          font-size: 14px;
          font-weight: 600;
          color: #334155;
          margin-bottom: 4px;
        }

        .photo-empty-desc {
          font-size: 12px;
          color: #64748b;
          margin: 0;
        }

        .photo-present-view {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          width: 100%;
        }

        .current-photo-preview {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          object-fit: cover;
        }

        .photo-actions {
          display: flex;
          gap: 32px;
          justify-content: center;
          margin-top: 16px;
        }

        .photo-action-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          color: #0f172a;
          font-size: 13px;
          font-weight: 500;
          background: none;
          border: none;
          transition: color 0.2s;
          padding: 0;
        }

        .photo-action-btn:hover {
          color: #0a66c2;
        }

        .placement-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .placement-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
        }

        .placement-btn:hover {
          background: #f8fafc;
        }

        .placement-btn.active {
          border-color: #0a66c2;
          background: #eff6ff;
          color: #0a66c2;
        }

        .placement-icon {
          width: 16px;
          height: 12px;
          border: 1px solid currentColor;
          border-radius: 2px;
          position: relative;
        }

        .placement-icon::after {
          content: '';
          position: absolute;
          width: 4px;
          height: 4px;
          background: currentColor;
          border-radius: 50%;
          top: 3px;
        }

        .left-icon::after { left: 2px; }
        .right-icon::after { right: 2px; }

        .shape-icon-circle {
          width: 14px; height: 14px;
          border: 2px solid currentColor;
          border-radius: 50%;
          position: relative;
        }
        .placement-btn.active .shape-icon-circle::after {
          content: '';
          position: absolute;
          top: 2px; left: 2px; right: 2px; bottom: 2px;
          background: currentColor;
          border-radius: 50%;
        }

        .shape-icon-square {
          width: 14px; height: 14px;
          border: 2px solid currentColor;
          border-radius: 3px;
          position: relative;
        }
        .placement-btn.active .shape-icon-square::after {
          content: '';
          position: absolute;
          top: 2px; left: 2px; right: 2px; bottom: 2px;
          background: currentColor;
          border-radius: 1px;
        }


        .item-desc {
          font-size: 12.5px;
          color: #475569;
          margin-left: 12px;
          word-break: break-word;
          overflow-wrap: break-word;
        }

        .skills-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .skill-pill {
          background: #f1f5f9;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          color: #475569;
        }

        @media print {
          .pages-stack, .page-num-outside { display: none !important; }
          .print-only-resume {
            position: static !important;
            left: auto !important;
            box-shadow: none !important;
            width: 100% !important;
          }
        }

        @media (max-width: 1024px) {
          .ai-resume-content {
            grid-template-columns: 1fr;
            grid-template-rows: auto 1fr;
            overflow-y: auto;
          }
          .ai-resume-controls {
            border-right: none;
            border-bottom: 1px solid #e2e8f0;
            max-height: 50vh;
          }
          .ai-resume-preview-wrap {
            padding: 20px 0;
            overflow: hidden; /* we let the parent scroll */
          }
          .ai-resume-builder-container {
            overflow: auto;
          }
          .ai-resume-content {
            overflow: visible;
          }
        }
        
        @media (max-width: 600px) {
          .ai-resume-header {
            flex-direction: column;
            gap: 12px;
            align-items: stretch;
          }
          .download-btn {
            justify-content: center;
          }
        }
      `}</style>

      {/* Image Cropper Modal */}
      {cropModalOpen && (
        <div className="cropper-modal-overlay">
          <div className="cropper-modal">
            <div className="cropper-header">
              <h3>Adjust Profile Photo</h3>
              <button onClick={() => setCropModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="cropper-body">
              <div className="cropper-container">
                <Cropper
                  image={imgSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape={resumeData.photoShape === 'circle' ? 'round' : 'rect'}
                  showGrid={false}
                  onCropChange={setCrop}
                  onCropComplete={(croppedArea, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels)}
                  onZoomChange={setZoom}
                />
              </div>
              <div className="cropper-controls">
                <label>Zoom</label>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(e.target.value)}
                  className="margin-slider"
                />
              </div>
            </div>
            <div className="cropper-footer">
              <button className="cancel-btn" onClick={() => setCropModalOpen(false)}>Cancel</button>
              <button className="save-btn" onClick={showCroppedImage}>Crop & Save</button>
            </div>
          </div>
          <style>{`
            .cropper-modal-overlay {
              position: fixed;
              top: 0; left: 0; right: 0; bottom: 0;
              background: rgba(15, 23, 42, 0.7);
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 100000;
              backdrop-filter: blur(4px);
            }
            .cropper-modal {
              background: white;
              border-radius: 16px;
              width: 90%;
              max-width: 480px;
              overflow: hidden;
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
            }
            .cropper-header {
              padding: 16px 24px;
              border-bottom: 1px solid #e2e8f0;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .cropper-header h3 {
              margin: 0;
              font-size: 16px;
              font-weight: 700;
              color: #1e293b;
            }
            .cropper-header button {
              background: none;
              border: none;
              color: #64748b;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 4px;
            }
            .cropper-header button:hover {
              color: #0f172a;
            }
            .cropper-body {
              padding: 24px;
            }
            .cropper-container {
              position: relative;
              width: 100%;
              height: 300px;
              background: #333;
              border-radius: 8px;
              overflow: hidden;
            }
            .cropper-controls {
              margin-top: 20px;
              display: flex;
              align-items: center;
              gap: 16px;
            }
            .cropper-controls label {
              font-size: 13px;
              font-weight: 600;
              color: #475569;
            }
            .cropper-footer {
              padding: 16px 24px;
              background: #f8fafc;
              border-top: 1px solid #e2e8f0;
              display: flex;
              justify-content: flex-end;
              gap: 12px;
            }
            .cropper-footer .cancel-btn {
              padding: 8px 16px;
              background: white;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              font-size: 14px;
              font-weight: 600;
              color: #64748b;
              cursor: pointer;
            }
            .cropper-footer .save-btn {
              padding: 8px 16px;
              background: #0a66c2;
              border: none;
              border-radius: 8px;
              font-size: 14px;
              font-weight: 600;
              color: white;
              cursor: pointer;
            }
            .upload-photo-btn {
              background: #eff6ff;
              color: #0a66c2;
              border: 1px solid #bfdbfe;
              padding: 8px 16px;
              border-radius: 8px;
              font-size: 13px;
              font-weight: 600;
              cursor: pointer;
              display: inline-flex;
              align-items: center;
              gap: 8px;
              transition: background 0.2s;
            }
            .upload-photo-btn:hover {
              background: #dbeafe;
            }
            .remove-photo-btn {
              background: #fef2f2;
              color: #ef4444;
              border: 1px solid #fecaca;
              padding: 8px 16px;
              border-radius: 8px;
              font-size: 13px;
              font-weight: 600;
              cursor: pointer;
              display: inline-flex;
              align-items: center;
              gap: 8px;
              transition: background 0.2s;
            }
            .remove-photo-btn:hover {
              background: #fee2e2;
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default AIResumeBuilder;
