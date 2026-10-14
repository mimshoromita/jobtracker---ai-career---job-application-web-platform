import { jsPDF } from 'jspdf';
import { CV } from '../types';

export function exportCVToPDF(cv: CV) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = 18;

  const checkPageOverflow = (increment: number) => {
    if (y + increment > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // Header Background Accent Bar
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(margin, y, contentWidth, 24, 'F');

  // Candidate Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(cv.fullName || 'Candidate Name', margin + 6, y + 10);

  // Target Role Headline
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(203, 213, 225); // Slate-300
  doc.text(cv.targetRole || 'Professional', margin + 6, y + 17);

  y += 30;

  // Contact Info Subheader
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105); // Slate-600
  const contacts = [
    cv.email ? `Email: ${cv.email}` : '',
    cv.phone ? `Phone: ${cv.phone}` : '',
    cv.location ? `Location: ${cv.location}` : '',
  ].filter(Boolean);

  if (contacts.length > 0) {
    doc.text(contacts.join('   |   '), margin, y);
    y += 6;
  }

  // Section Divider Line Helper
  const drawSectionHeader = (title: string) => {
    checkPageOverflow(14);
    y += 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42); // Slate-900
    doc.text(title.toUpperCase(), margin, y);

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.line(margin, y + 2, margin + contentWidth, y + 2);
    y += 7;
  };

  // Professional Summary
  if (cv.summary) {
    drawSectionHeader('Professional Summary');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);

    const splitSummary = doc.splitTextToSize(cv.summary, contentWidth);
    doc.text(splitSummary, margin, y);
    y += splitSummary.length * 4.5 + 4;
  }

  // Core Skills
  if (cv.skills && cv.skills.length > 0) {
    drawSectionHeader('Core Competencies & Skills');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);

    const skillsText = cv.skills.join('  •  ');
    const splitSkills = doc.splitTextToSize(skillsText, contentWidth);
    doc.text(splitSkills, margin, y);
    y += splitSkills.length * 4.5 + 4;
  }

  // Work Experience
  if (cv.experience && cv.experience.length > 0) {
    drawSectionHeader('Professional Experience');

    cv.experience.forEach((exp) => {
      checkPageOverflow(18);

      // Title & Company
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      const titleLine = `${exp.title || 'Role'} - ${exp.company || 'Company'}`;
      doc.text(titleLine, margin, y);

      // Dates on right
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      const dates = `${exp.startDate || ''} - ${exp.current ? 'Present' : exp.endDate || ''}`;
      doc.text(dates, margin + contentWidth - doc.getTextWidth(dates), y);

      y += 5;

      // Description
      if (exp.description) {
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        const splitDesc = doc.splitTextToSize(exp.description, contentWidth);
        checkPageOverflow(splitDesc.length * 4);
        doc.text(splitDesc, margin, y);
        y += splitDesc.length * 4 + 3;
      } else {
        y += 2;
      }
    });
  }

  // Education
  if (cv.education && cv.education.length > 0) {
    drawSectionHeader('Education');

    cv.education.forEach((edu) => {
      checkPageOverflow(12);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      const degreeText = `${edu.degree || 'Degree'} in ${edu.fieldOfStudy || 'Field'}`;
      doc.text(degreeText, margin, y);

      if (edu.graduationYear) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        doc.text(edu.graduationYear, margin + contentWidth - doc.getTextWidth(edu.graduationYear), y);
      }

      y += 4.5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(edu.institution || '', margin, y);
      y += 6;
    });
  }

  // Projects
  if (cv.projects && cv.projects.length > 0) {
    drawSectionHeader('Key Projects');

    cv.projects.forEach((proj) => {
      checkPageOverflow(14);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(proj.title || 'Project', margin, y);

      if (proj.technologies) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        const techWidth = doc.getTextWidth(`[${proj.technologies}]`);
        doc.text(`[${proj.technologies}]`, margin + contentWidth - techWidth, y);
      }

      y += 4;
      if (proj.description) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        const splitDesc = doc.splitTextToSize(proj.description, contentWidth);
        checkPageOverflow(splitDesc.length * 4);
        doc.text(splitDesc, margin, y);
        y += splitDesc.length * 4 + 3;
      }
    });
  }

  // Certifications
  if (cv.certifications && cv.certifications.length > 0) {
    drawSectionHeader('Certifications & Credentials');

    cv.certifications.forEach((cert) => {
      checkPageOverflow(8);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`• ${cert.name}`, margin, y);

      const meta = [cert.issuer, cert.year].filter(Boolean).join(', ');
      if (meta) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(`(${meta})`, margin + doc.getTextWidth(`• ${cert.name} `), y);
      }
      y += 5;
    });
  }

  // Footer
  const safeFilename = (cv.fullName || 'JobTracker_CV')
    .replace(/[^\w]/g, '_')
    .toLowerCase();
  doc.save(`${safeFilename}_resume.pdf`);
}
