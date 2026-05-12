import ExcelJS from 'exceljs';

const getFormValue = (formData, fieldId) => {
  if (!formData) return '';
  const value = typeof formData.get === 'function' ? formData.get(fieldId) : formData[fieldId];
  if (Array.isArray(value)) return value.join(', ');
  return value ?? '';
};

const buildFieldHeaders = (registrations, formFields = []) => {
  const orderedFields = [...formFields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const fieldHeaders = orderedFields.map(field => ({
    id: field.fieldId,
    label: field.label || field.fieldId
  }));

  const knownIds = new Set(fieldHeaders.map(field => field.id));

  registrations.forEach((reg) => {
    const entries = reg.formData instanceof Map
      ? Array.from(reg.formData.keys())
      : Object.keys(reg.formData || {});

    entries.forEach((fieldId) => {
      if (!knownIds.has(fieldId)) {
        knownIds.add(fieldId);
        fieldHeaders.push({ id: fieldId, label: fieldId });
      }
    });
  });

  return fieldHeaders;
};

export const generateExcelReport = async (registrations, workshopTitle, formFields = []) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Registrations');
  const fieldHeaders = buildFieldHeaders(registrations, formFields);

  // Add title
  const finalColumn = Math.max(3 + fieldHeaders.length, 3);
  worksheet.mergeCells(1, 1, 1, finalColumn);
  worksheet.getCell('A1').value = `${workshopTitle} - Registration Report`;
  worksheet.getCell('A1').font = { bold: true, size: 14 };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };

  // Add timestamp
  worksheet.mergeCells(2, 1, 2, finalColumn);
  worksheet.getCell('A2').value = `Generated on ${new Date().toLocaleString()}`;
  worksheet.getCell('A2').font = { italic: true };
  worksheet.getCell('A2').alignment = { horizontal: 'center' };

  // Add headers
  let headerIndex = 4;
  const headers = ['Name', 'Email', 'Registration Date', ...fieldHeaders.map(field => field.label)];
  headers.forEach((header, index) => {
    const cell = worksheet.getCell(headerIndex, index + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    cell.alignment = { horizontal: 'center' };
  });

  // Add data rows
  let rowIndex = 5;
  registrations.forEach((reg) => {
    worksheet.getCell(rowIndex, 1).value = reg.userId.name;
    worksheet.getCell(rowIndex, 2).value = reg.userId.email;
    worksheet.getCell(rowIndex, 3).value = new Date(reg.createdAt).toLocaleString();

    fieldHeaders.forEach((field, index) => {
      worksheet.getCell(rowIndex, index + 4).value = getFormValue(reg.formData, field.id);
    });

    rowIndex++;
  });

  // Auto-fit columns
  worksheet.columns.forEach(column => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, cell => {
      const cellLength = cell.value ? cell.value.toString().length : 0;
      if (cellLength > maxLength) {
        maxLength = cellLength;
      }
    });
    column.width = maxLength < 12 ? 12 : maxLength + 2;
  });

  return workbook;
};
