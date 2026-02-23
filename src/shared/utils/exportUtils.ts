import { format } from 'date-fns';

export interface ExportMetadata {
  exportedBy?: string;
  filters?: Record<string, string>;
}

function buildMetadataRows(metadata?: ExportMetadata, separator = ','): string[] {
  if (!metadata) return [];
  const rows: string[] = [];
  rows.push(`# Exported: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`);
  if (metadata.exportedBy) rows.push(`# Exported By: ${metadata.exportedBy}`);
  if (metadata.filters && Object.keys(metadata.filters).length > 0) {
    const filterStr = Object.entries(metadata.filters).map(([k, v]) => `${k}=${v}`).join(', ');
    rows.push(`# Filters: ${filterStr}`);
  }
  rows.push('# ---');
  return rows;
}

export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; label: string }[],
  metadata?: ExportMetadata
): void {
  if (data.length === 0) {
    alert('No data to export');
    return;
  }

  const headers = columns 
    ? columns.map(col => col.label) 
    : Object.keys(data[0]);
  
  const keys = columns 
    ? columns.map(col => col.key) 
    : Object.keys(data[0]) as (keyof T)[];

  const metaRows = buildMetadataRows(metadata);
  const csvContent = [
    ...metaRows,
    headers.join(','),
    ...data.map(row => 
      keys.map(key => {
        const value = row[key];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return String(value);
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToPDF<T extends Record<string, unknown>>(
  dataOrTitle: T[] | string,
  titleOrContent: string,
  filename: string
): void {
  let tableHTML: string;
  let title: string;

  // Check if first argument is an array (new signature) or string (legacy signature)
  if (Array.isArray(dataOrTitle)) {
    const data = dataOrTitle;
    title = titleOrContent;
    
    if (data.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    
    tableHTML = '<table><thead><tr>';
    headers.forEach(header => {
      tableHTML += `<th>${header}</th>`;
    });
    tableHTML += '</tr></thead><tbody>';
    
    data.forEach(row => {
      tableHTML += '<tr>';
      headers.forEach(header => {
        const value = row[header];
        tableHTML += `<td>${value ?? ''}</td>`;
      });
      tableHTML += '</tr>';
    });
    tableHTML += '</tbody></table>';
  } else {
    // Legacy signature: (title, content, filename)
    title = dataOrTitle;
    tableHTML = titleOrContent;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to download PDF');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
        }
        h1 {
          color: #1a1a1a;
          border-bottom: 2px solid #e5e5e5;
          padding-bottom: 10px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th, td {
          border: 1px solid #e5e5e5;
          padding: 10px;
          text-align: left;
        }
        th {
          background: #f5f5f5;
          font-weight: 600;
        }
        .meta {
          color: #666;
          font-size: 14px;
          margin-bottom: 20px;
        }
        .summary {
          background: #f5f5f5;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .summary-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
        }
        @media print {
          body { padding: 20px; }
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <div class="meta">Generated on: ${format(new Date(), 'dd MMMM yyyy, HH:mm')}</div>
      ${tableHTML}
    </body>
    </html>
  `);

  printWindow.document.close();
  
  setTimeout(() => {
    printWindow.print();
  }, 250);
}

export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; label: string }[],
  metadata?: ExportMetadata
): void {
  if (data.length === 0) {
    alert('No data to export');
    return;
  }

  const headers = columns ? columns.map(col => col.label) : Object.keys(data[0]);
  const keys = columns ? columns.map(col => col.key) : Object.keys(data[0]) as (keyof T)[];

  const metaRows = buildMetadataRows(metadata, '\t');
  const csvContent = [
    ...metaRows,
    headers.join('\t'),
    ...data.map(row =>
      keys.map(key => {
        const value = row[key];
        if (value === null || value === undefined) return '';
        const str = String(value);
        if (str.includes('\t') || str.includes('\n') || str.includes('"')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join('\t')
    )
  ].join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${format(new Date(), 'yyyy-MM-dd')}.xls`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function generateReportHTML<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: keyof T; label: string; format?: (value: unknown) => string }[],
  summary?: { label: string; value: string }[]
): string {
  let html = '';

  if (summary && summary.length > 0) {
    html += '<div class="summary">';
    summary.forEach(item => {
      html += `<div class="summary-item"><span>${item.label}</span><strong>${item.value}</strong></div>`;
    });
    html += '</div>';
  }

  html += '<table><thead><tr>';
  columns.forEach(col => {
    html += `<th>${col.label}</th>`;
  });
  html += '</tr></thead><tbody>';

  data.forEach(row => {
    html += '<tr>';
    columns.forEach(col => {
      const value = row[col.key];
      const formatted = col.format ? col.format(value) : String(value ?? '');
      html += `<td>${formatted}</td>`;
    });
    html += '</tr>';
  });

  html += '</tbody></table>';

  return html;
}
