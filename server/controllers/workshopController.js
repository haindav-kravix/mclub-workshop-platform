import Workshop from '../models/Workshop.js';
import Registration from '../models/Registration.js';
import Attendance from '../models/Attendance.js';
import JSZip from 'jszip';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const parseRegistrationFormFields = (fields) => {
  if (!fields) return [];
  if (Array.isArray(fields)) return fields;
  if (typeof fields !== 'string') return fields;

  try {
    const parsed = JSON.parse(fields);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const parseDailyTimings = (timings) => {
  if (!timings) return [];
  if (Array.isArray(timings)) return timings;
  if (typeof timings !== 'string') return [];

  try {
    const parsed = JSON.parse(timings);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const uploadedFileToDataUrl = (file) => {
  const fileBuffer = fs.readFileSync(file.path);
  fs.unlink(file.path, (err) => {
    if (err) console.error('Error deleting temporary upload:', err);
  });
  return `data:${file.mimetype};base64,${fileBuffer.toString('base64')}`;
};

const cleanupUploadedFile = (file) => {
  if (!file?.path) return;
  fs.unlink(file.path, (err) => {
    if (err) console.error('Error deleting file:', err);
  });
};

const deleteLegacyUpload = (coverImage) => {
  if (!coverImage?.startsWith('/uploads/')) return;
  const imagePath = path.join(__dirname, '..', coverImage);
  fs.unlink(imagePath, (err) => {
    if (err) console.error('Error deleting file:', err);
  });
};

const escapeXml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const formatDate = (value) => {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(value));
};

const formatWorkshopDates = (workshop) => {
  const start = workshop.startDate || workshop.date;
  const end = workshop.endDate || workshop.startDate || workshop.date;
  const startText = formatDate(start);
  const endText = formatDate(end);
  return startText === endText ? startText : `${startText} to ${endText}`;
};

const safeFileName = (value = 'workshop-report') => String(value)
  .replace(/[^a-z0-9]+/gi, '-')
  .replace(/^-+|-+$/g, '')
  .toLowerCase() || 'workshop-report';

const parseGeminiJson = (text = '') => {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
};

const buildReportPrompt = ({ workshop, workshopDates, registeredCount, confirmedCount, attendanceSessions, attendanceTotals, topics }) => `
Generate formal workshop report narrative sections for an institutional MongoDB Technical Club report.

Use only the sanitized workshop facts below. Do not include participant names, emails, phone numbers, project details, raw form responses, or private submitted data.

Facts:
Workshop title: ${workshop.title}
Workshop description: ${workshop.description}
Workshop dates: ${workshopDates}
Venue/mode: ${workshop.venue}
Duration: ${workshop.duration}
Timing: ${workshop.time}
Total registrations: ${registeredCount}
Confirmed registrations: ${confirmedCount}
Attendance sessions recorded: ${attendanceSessions}
Total present marks: ${attendanceTotals.present}
Total absent marks: ${attendanceTotals.absent}
Draft topics: ${topics.join('; ')}

Return valid JSON only with these keys:
{
  "executiveSummary": "one polished paragraph",
  "aboutWorkshop": "one polished paragraph",
  "workshopOverview": "one polished paragraph",
  "topicsCovered": ["4 to 6 concise topic bullets"],
  "learningOutcomes": ["3 to 5 concise outcome bullets"],
  "observations": ["3 concise observation or recommendation bullets"],
  "conclusion": "one polished paragraph"
}
`;

const generateOpenRouterNarrative = async (prompt) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const model = process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash';

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
        'X-Title': 'MongoDB Club Workshop Reports'
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You generate privacy-conscious institutional workshop report sections. Return JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 1800,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      console.error('OpenRouter report generation failed:', response.status, await response.text());
      return null;
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    return parseGeminiJson(text);
  } catch (error) {
    console.error('OpenRouter report generation error:', error);
    return null;
  }
};

const generateGeminiNarrative = async ({ workshop, workshopDates, registeredCount, confirmedCount, attendanceSessions, attendanceTotals, topics }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const prompt = buildReportPrompt({
    workshop,
    workshopDates,
    registeredCount,
    confirmedCount,
    attendanceSessions,
    attendanceTotals,
    topics
  });

  if (!apiKey) return generateOpenRouterNarrative(prompt);

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1800,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      console.error('Gemini report generation failed:', response.status, await response.text());
      return null;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('\n') || '';
    return parseGeminiJson(text);
  } catch (error) {
    console.error('Gemini report generation error:', error);
    return generateOpenRouterNarrative(prompt);
  }
};

const paragraph = (text, style = 'Normal') => `
  <w:p>
    <w:pPr><w:pStyle w:val="${style}"/></w:pPr>
    <w:r><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>
  </w:p>`;

const pageBreak = () => `
  <w:p>
    <w:r><w:br w:type="page"/></w:r>
  </w:p>`;

const bullet = (text) => `
  <w:p>
    <w:pPr>
      <w:pStyle w:val="Normal"/>
      <w:ind w:left="720" w:hanging="360"/>
    </w:pPr>
    <w:r><w:t xml:space="preserve">• ${escapeXml(text)}</w:t></w:r>
  </w:p>`;

const tableRow = (cells, header = false) => `
  <w:tr>
    ${cells.map(cell => `
      <w:tc>
        <w:tcPr><w:tcW w:w="2400" w:type="dxa"/><w:shd w:fill="${header ? 'D9FBE7' : 'FFFFFF'}"/></w:tcPr>
        <w:p><w:r>${header ? '<w:rPr><w:b/></w:rPr>' : ''}<w:t xml:space="preserve">${escapeXml(cell)}</w:t></w:r></w:p>
      </w:tc>
    `).join('')}
  </w:tr>`;

const table = (rows) => `
  <w:tbl>
    <w:tblPr>
      <w:tblW w:w="9360" w:type="dxa"/>
      <w:tblBorders>
        <w:top w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
        <w:left w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
        <w:bottom w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
        <w:right w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
        <w:insideH w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
        <w:insideV w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
      </w:tblBorders>
      <w:tblCellMar>
        <w:top w:w="120" w:type="dxa"/><w:left w:w="120" w:type="dxa"/>
        <w:bottom w:w="120" w:type="dxa"/><w:right w:w="120" w:type="dxa"/>
      </w:tblCellMar>
    </w:tblPr>
    ${rows.map((row, index) => tableRow(row, index === 0)).join('')}
  </w:tbl>`;

const buildWorkshopReportDocx = async ({ workshop, registrations, attendanceReports }) => {
  const zip = new JSZip();
  const submissionDate = formatDate(new Date());
  const workshopDates = formatWorkshopDates(workshop);
  const submittedBy = workshop.createdBy?.name || 'MongoDB Club Admin';
  const registeredCount = registrations.length;
  const confirmedCount = registrations.filter(item => item.status === 'confirmed').length;
  const participationText = `${confirmedCount} confirmed registration${confirmedCount === 1 ? '' : 's'}`;
  const description = workshop.description || `The workshop focused on practical MongoDB learning through guided sessions and hands-on activities.`;
  const attendanceSessions = attendanceReports.length;
  const attendanceTotals = attendanceReports.reduce((totals, report) => {
    totals.present += report.entries.filter(entry => entry.status === 'present').length;
    totals.absent += report.entries.filter(entry => entry.status === 'absent').length;
    return totals;
  }, { present: 0, absent: 0 });
  const averageAttendance = attendanceSessions
    ? Math.round(attendanceTotals.present / attendanceSessions)
    : 0;
  const topicCandidates = description
    .split(/[\n.;]+/)
    .map(item => item.trim())
    .filter(item => item.length > 24)
    .slice(0, 5);
  const topics = topicCandidates.length ? topicCandidates : [
    'Introduction to MongoDB concepts, use cases, and document-oriented database design',
    'Practical demonstrations using MongoDB Atlas, Compass, and CRUD operations',
    'Hands-on exercises designed to help students apply database concepts',
    'Discussion of MongoDB community, certification, and learning pathways'
  ];
  const aiNarrative = await generateGeminiNarrative({
    workshop,
    workshopDates,
    registeredCount,
    confirmedCount,
    attendanceSessions,
    attendanceTotals,
    topics
  });
  const reportExecutiveSummary = aiNarrative?.executiveSummary || `This report documents the planning, delivery, student participation, and administrative outcomes of the ${workshop.title} workshop. It was generated from the MongoDB Club website records, including workshop configuration, registration data, attendance records where available, and registration form metadata.`;
  const reportAboutWorkshop = aiNarrative?.aboutWorkshop || `${workshop.title} was planned as a structured MongoDB Technical Club learning activity. The workshop was hosted at ${workshop.venue} during ${workshopDates}, with a configured duration of ${workshop.duration}. The website was used to publish the workshop, collect registrations, manage attendance where available, and generate this formal record for review.`;
  const reportOverview = aiNarrative?.workshopOverview || `${description} The session was managed through the MongoDB Club website, including workshop publishing, student registrations, and administrative tracking.`;
  const reportTopics = Array.isArray(aiNarrative?.topicsCovered) && aiNarrative.topicsCovered.length
    ? aiNarrative.topicsCovered
    : topics;
  const reportOutcomes = Array.isArray(aiNarrative?.learningOutcomes) && aiNarrative.learningOutcomes.length
    ? aiNarrative.learningOutcomes
    : [
      'Awareness of MongoDB fundamentals and practical database workflows.',
      'Exposure to real-world use cases and structured hands-on learning.',
      'Access to workshop communication and follow-up resources through the website.'
    ];
  const reportObservations = Array.isArray(aiNarrative?.observations) && aiNarrative.observations.length
    ? aiNarrative.observations
    : [
      'Continue using the website for centralized workshop publishing, registrations, exports, and attendance tracking.',
      'Record attendance for every session so future reports can include accurate participation trends.',
      'Maintain clear registration fields for internal administration while keeping generated reports privacy-conscious.'
    ];
  const reportConclusion = aiNarrative?.conclusion || `The ${workshop.title} workshop was completed as a focused learning initiative. The website-supported registration and management flow helped organize participant data, capture administrative evidence, and maintain a consistent record for departmental review and future workshops.`;

  const metadataRows = [
    ['Field', 'Details'],
    ['Workshop Title', workshop.title],
    ['Workshop Dates', workshopDates],
    ['Venue / Mode', workshop.venue],
    ['Duration', workshop.duration],
    ['Timing', workshop.time],
    ['Registration Status', workshop.registrationsOpen !== false && !workshop.isStopped ? 'Open' : 'Closed'],
    ['Workshop Status', workshop.isStopped ? 'Stopped' : 'Running'],
    ['Report Generated On', submissionDate],
    ['Generated By', submittedBy]
  ];

  const scheduleRows = [
    ['Date', 'Start Time', 'End Time'],
    ...(workshop.dailyTimings?.length ? workshop.dailyTimings.map(item => [
      formatDate(item.date),
      item.startTime,
      item.endTime
    ]) : [[formatDate(workshop.date), workshop.time, '-']])
  ];

  const analyticsRows = [
    ['Metric', 'Value'],
    ['Total Registrations', String(registeredCount)],
    ['Confirmed Registrations', String(confirmedCount)],
    ['Attendance Sessions Recorded', String(attendanceSessions)],
    ['Average Present Per Session', attendanceSessions ? String(averageAttendance) : 'Attendance not recorded']
  ];

  const attendanceRows = [
    ['Date', 'Present', 'Absent', 'Submitted By'],
    ...(attendanceReports.length ? attendanceReports.map(report => [
      formatDate(report.date),
      String(report.entries.filter(entry => entry.status === 'present').length),
      String(report.entries.filter(entry => entry.status === 'absent').length),
      report.submittedBy?.name || '-'
    ]) : [['-', '-', '-', 'No attendance records available']])
  ];

  const formFieldRows = [
    ['Order', 'Field Label', 'Type', 'Required'],
    ...(workshop.registrationFormFields?.length ? workshop.registrationFormFields.map(field => [
      String(field.order + 1),
      field.label,
      field.type,
      field.required ? 'Yes' : 'No'
    ]) : [['-', 'Default registration fields', '-', '-']])
  ];

  const registrationRows = [
    ['Registration Status', 'Count'],
    ['Confirmed', String(confirmedCount)],
    ['Total', String(registeredCount)]
  ];

  const body = [
    paragraph(`Report on ${workshop.title}`, 'Title'),
    paragraph('MongoDB Technical Club Workshop Report', 'Subtitle'),
    paragraph(`Date of Submission: ${submissionDate}`),
    paragraph('Submitted to: Department / Workshop Coordinator'),
    paragraph(`Submitted by: ${submittedBy}`),
    paragraph(`Workshop Dates: ${workshopDates}`),
    paragraph(`Location: ${workshop.venue}`),
    paragraph(`Registered Participants: ${registeredCount}`),
    pageBreak(),
    paragraph('Executive Summary', 'Heading1'),
    paragraph(reportExecutiveSummary),
    table(analyticsRows),
    paragraph('Workshop Information', 'Heading1'),
    table(metadataRows),
    paragraph('1. About the Workshop', 'Heading1'),
    paragraph(reportAboutWorkshop),
    paragraph('2. Workshop Overview', 'Heading1'),
    paragraph(reportOverview),
    paragraph('3. Topics Covered', 'Heading1'),
    ...reportTopics.map(item => bullet(item)),
    paragraph('4. Workshop Schedule', 'Heading1'),
    table(scheduleRows),
    paragraph('5. Registration and Participation Analysis', 'Heading1'),
    paragraph(`The workshop recorded ${registeredCount} total registration${registeredCount === 1 ? '' : 's'}, including ${participationText}. The registration data is summarized at an aggregate level to keep the generated report suitable for sharing and review.`),
    table(registrationRows),
    paragraph('6. Attendance Summary', 'Heading1'),
    paragraph(attendanceSessions ? `Attendance was recorded for ${attendanceSessions} session(s), with ${attendanceTotals.present} total present marks and ${attendanceTotals.absent} total absent marks across all attendance submissions.` : 'Attendance has not yet been recorded for this workshop. This section will become more detailed after admins submit attendance through the attendance module.'),
    table(attendanceRows),
    paragraph('7. Student Engagement and Learning Outcomes', 'Heading1'),
    paragraph(`The workshop recorded ${registeredCount} total registration${registeredCount === 1 ? '' : 's'}, with ${participationText}. Students engaged through the published workshop material, registration workflow, and session participation.`),
    ...reportOutcomes.map(item => bullet(item)),
    paragraph('8. Observations and Recommendations', 'Heading1'),
    ...reportObservations.map(item => bullet(item)),
    paragraph('9. Conclusion', 'Heading1'),
    paragraph(reportConclusion),
    pageBreak(),
    paragraph('Appendix: Registration Form Fields', 'Heading1'),
    paragraph('The following fields were used for registration setup. Individual student responses and personal contact details are intentionally excluded from this generated workshop report. Admins can use the separate registration export when detailed participant data is explicitly required.'),
    table(formFieldRows),
    paragraph('Privacy Note', 'Heading1'),
    paragraph('This report avoids disclosing participant-submitted project details, phone numbers, email addresses, or raw form response values. The report is intended for workshop documentation and departmental review, not for sharing personal registration data.')
  ].join('');

  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`);
  zip.folder('_rels').file('.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);
  zip.folder('word').folder('_rels').file('document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`);
  zip.folder('word').file('styles.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="22"/></w:rPr><w:pPr><w:spacing w:after="160" w:line="276" w:lineRule="auto"/></w:pPr></w:style>
  <w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:b/><w:sz w:val="34"/><w:color w:val="001E2B"/></w:rPr><w:pPr><w:spacing w:after="300"/></w:pPr></w:style>
  <w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:basedOn w:val="Normal"/><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="24"/><w:color w:val="00A652"/></w:rPr><w:pPr><w:spacing w:after="300"/></w:pPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:b/><w:sz w:val="26"/><w:color w:val="00A652"/></w:rPr><w:pPr><w:spacing w:before="240" w:after="120"/></w:pPr></w:style>
</w:styles>`);
  zip.folder('word').file('document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${body}
    <w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr>
  </w:body>
</w:document>`);

  return zip.generateAsync({ type: 'nodebuffer' });
};

export const createWorkshop = async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      startDate,
      endDate,
      time,
      venue,
      duration,
      capacity,
      registrationFormFields,
      dailyTimings,
      telegramLink
    } = req.body;
    const parsedTimings = parseDailyTimings(dailyTimings);
    const firstTiming = parsedTimings[0];

    if (!req.file) {
      return res.status(400).json({ message: 'Cover image is required' });
    }

    const coverImage = uploadedFileToDataUrl(req.file);

    const workshop = new Workshop({
      title,
      description,
      coverImage,
      date: startDate || date,
      startDate: startDate || date,
      endDate: endDate || startDate || date,
      time: firstTiming?.startTime || time,
      dailyTimings: parsedTimings,
      telegramLink: telegramLink || '',
      venue,
      duration,
      capacity,
      registrationFormFields: parseRegistrationFormFields(registrationFormFields),
      createdBy: req.user.id
    });

    await workshop.save();
    res.status(201).json({ success: true, workshop });
  } catch (error) {
    // Clean up uploaded file if there's an error
    cleanupUploadedFile(req.file);
    res.status(500).json({ message: 'Error creating workshop', error: error.message });
  }
};

export const getAllWorkshops = async (req, res) => {
  try {
    const workshops = await Workshop.find({ isActive: true, isStopped: { $ne: true } })
      .populate('createdBy', 'name email')
      .sort({ date: 1 });
    res.json(workshops);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching workshops', error: error.message });
  }
};

export const getWorkshopById = async (req, res) => {
  try {
    const workshop = await Workshop.findById(req.params.id)
      .populate('createdBy', 'name email');
    
    if (!workshop || workshop.isStopped || !workshop.isActive) {
      return res.status(404).json({ message: 'Workshop not found' });
    }
    
    res.json(workshop);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching workshop', error: error.message });
  }
};

export const updateWorkshop = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      date,
      startDate,
      endDate,
      time,
      venue,
      duration,
      capacity,
      registrationFormFields,
      dailyTimings,
      telegramLink
    } = req.body;
    const parsedTimings = parseDailyTimings(dailyTimings);
    const firstTiming = parsedTimings[0];

    const updateData = {
      title,
      description,
      date: startDate || date,
      startDate: startDate || date,
      endDate: endDate || startDate || date,
      time: firstTiming?.startTime || time,
      dailyTimings: parsedTimings,
      telegramLink: telegramLink || '',
      venue,
      duration,
      capacity,
      registrationFormFields: parseRegistrationFormFields(registrationFormFields),
      updatedAt: new Date()
    };

    if (req.file) {
      const workshop = await Workshop.findById(id);
      if (workshop?.coverImage) deleteLegacyUpload(workshop.coverImage);
      updateData.coverImage = uploadedFileToDataUrl(req.file);
    }

    const workshop = await Workshop.findByIdAndUpdate(id, updateData, { new: true })
      .populate('createdBy', 'name email');

    res.json({ success: true, workshop });
  } catch (error) {
    cleanupUploadedFile(req.file);
    res.status(500).json({ message: 'Error updating workshop', error: error.message });
  }
};

export const deleteWorkshop = async (req, res) => {
  try {
    const workshop = await Workshop.findByIdAndDelete(req.params.id);
    
    if (!workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }

    deleteLegacyUpload(workshop.coverImage);

    // Delete registrations
    await Registration.deleteMany({ workshopId: workshop._id });

    res.json({ success: true, message: 'Workshop deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting workshop', error: error.message });
  }
};

export const getAdminWorkshops = async (req, res) => {
  try {
    const workshops = await Workshop.find({})
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(workshops);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching workshops', error: error.message });
  }
};

export const generateWorkshopReport = async (req, res) => {
  try {
    const workshop = await Workshop.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }

    const registrations = await Registration.find({ workshopId: workshop._id })
      .populate('userId', 'name email')
      .sort({ createdAt: 1 });
    const attendanceReports = await Attendance.find({ workshopId: workshop._id })
      .populate('entries.userId', 'name email')
      .populate('submittedBy', 'name email')
      .sort({ date: 1 });

    const reportBuffer = await buildWorkshopReportDocx({ workshop, registrations, attendanceReports });
    const fileName = `${safeFileName(workshop.title)}-workshop-report.docx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(reportBuffer);
  } catch (error) {
    res.status(500).json({ message: 'Error generating workshop report', error: error.message });
  }
};

export const toggleWorkshopStatus = async (req, res) => {
  try {
    const workshop = await Workshop.findById(req.params.id);
    if (!workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }

    workshop.isActive = !workshop.isActive;
    await workshop.save();

    res.json({ success: true, workshop });
  } catch (error) {
    res.status(500).json({ message: 'Error updating workshop status', error: error.message });
  }
};

export const toggleRegistrationStatus = async (req, res) => {
  try {
    const workshop = await Workshop.findById(req.params.id);
    if (!workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }

    workshop.registrationsOpen = !workshop.registrationsOpen;
    await workshop.save();

    res.json({ success: true, workshop });
  } catch (error) {
    res.status(500).json({ message: 'Error updating registration status', error: error.message });
  }
};

export const toggleStoppedStatus = async (req, res) => {
  try {
    const workshop = await Workshop.findById(req.params.id);
    if (!workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }

    workshop.isStopped = !workshop.isStopped;
    if (workshop.isStopped) {
      workshop.registrationsOpen = false;
    }
    await workshop.save();

    res.json({ success: true, workshop });
  } catch (error) {
    res.status(500).json({ message: 'Error updating workshop stop status', error: error.message });
  }
};
