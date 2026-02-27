export interface MessageTemplate {
  id: string;
  label: string;
  type: 'sms' | 'whatsapp' | 'letter' | 'legal';
  subject?: string;
  body: string;
}

export const COLLECTIONS_TEMPLATES: MessageTemplate[] = [
  {
    id: 'friendly_reminder',
    label: 'Pengingat Ramah (SMS)',
    type: 'sms',
    body: `Yth. {{tenantName}},

Ini adalah pengingat bahwa tagihan Anda sebesar Rp {{amount}} untuk invoice {{invoiceNumber}} telah jatuh tempo pada {{dueDate}}.

Mohon segera melakukan pembayaran. Jika sudah membayar, mohon abaikan pesan ini.

Terima kasih,
{{merchantName}}`,
  },
  {
    id: 'firm_followup',
    label: 'Tindak Lanjut Tegas (WhatsApp)',
    type: 'whatsapp',
    body: `Yth. {{tenantName}},

Kami mencatat bahwa tagihan Rp {{amount}} (Invoice: {{invoiceNumber}}) telah melewati jatuh tempo selama {{daysOverdue}} hari.

Mohon segera menyelesaikan pembayaran untuk menghindari tindakan lebih lanjut. Hubungi kami jika ada kendala pembayaran.

Hormat kami,
{{merchantName}}`,
  },
  {
    id: 'warning_letter',
    label: 'Surat Peringatan',
    type: 'letter',
    subject: 'SURAT PERINGATAN - Tunggakan Pembayaran',
    body: `Kepada Yth. {{tenantName}},
Unit: {{unitNumber}}

Dengan hormat,

Melalui surat ini kami sampaikan bahwa Anda memiliki tunggakan pembayaran sebesar Rp {{amount}} untuk Invoice {{invoiceNumber}} yang telah jatuh tempo sejak {{dueDate}} ({{daysOverdue}} hari).

Kami meminta Anda untuk segera menyelesaikan kewajiban pembayaran ini dalam waktu 7 (tujuh) hari kerja sejak surat ini diterbitkan.

Apabila dalam jangka waktu tersebut tidak ada penyelesaian, kami akan mengambil langkah-langkah lebih lanjut sesuai ketentuan kontrak sewa.

Demikian surat peringatan ini kami sampaikan.

Hormat kami,
{{merchantName}}`,
  },
  {
    id: 'legal_notice',
    label: 'Somasi Hukum',
    type: 'legal',
    subject: 'SOMASI - Tunggakan Pembayaran Sewa',
    body: `Kepada Yth. {{tenantName}},
Unit: {{unitNumber}}
Perihal: Somasi Tunggakan Pembayaran

Dengan hormat,

Berdasarkan Perjanjian Sewa yang telah ditandatangani, Anda memiliki kewajiban pembayaran yang belum diselesaikan:

- Invoice: {{invoiceNumber}}
- Jumlah: Rp {{amount}}
- Jatuh Tempo: {{dueDate}}
- Keterlambatan: {{daysOverdue}} hari

Surat ini merupakan SOMASI RESMI yang mewajibkan Anda menyelesaikan seluruh kewajiban dalam waktu 14 (empat belas) hari kalender.

Apabila tidak diselesaikan, kami akan menempuh jalur hukum sesuai peraturan yang berlaku.

Hormat kami,
{{merchantName}}`,
  },
];

export function fillTemplate(template: MessageTemplate, data: Record<string, string>): MessageTemplate {
  let body = template.body;
  let subject = template.subject || '';
  for (const [key, value] of Object.entries(data)) {
    const re = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    body = body.replace(re, value);
    subject = subject.replace(re, value);
  }
  return { ...template, body, subject };
}
