import puppeteer from 'puppeteer';
import { getTenantDb } from '../config/database';

export class BulletinService {
  static getMention(avg: number | null): string {
    if (avg === null) return '—';
    if (avg >= 16) return 'Très Bien';
    if (avg >= 14) return 'Bien';
    if (avg >= 12) return 'Assez Bien';
    if (avg >= 10) return 'Passable';
    return 'Insuffisant';
  }

  static async getClassRanking(
    schemaName: string,
    studentId: string,
    academicYearId: string,
    trimester: number,
  ): Promise<{ rank: number; total: number; average: number | null }> {
    const db = getTenantDb(schemaName);
    const student = await db('students').where({ id: studentId }).first();
    if (!student?.class_id) return { rank: 0, total: 0, average: null };

    const classmates = await db('students')
      .where({ class_id: student.class_id })
      .select('id');
    const classmateIds = classmates.map((s: any) => s.id);
    const averages: { studentId: string; average: number }[] = [];

    for (const id of classmateIds) {
      const grades = await db('grades')
        .where({
          student_id: id,
          academic_year_id: academicYearId,
          term: trimester,
        })
        .select('value', 'coefficient');
      if (grades.length === 0) continue;
      let tw = 0,
        tc = 0;
      for (const g of grades) {
        tw += Number(g.value) * Number(g.coefficient || 1);
        tc += Number(g.coefficient || 1);
      }
      if (tc > 0) averages.push({ studentId: id, average: tw / tc });
    }

    averages.sort((a, b) => b.average - a.average);
    const myIndex = averages.findIndex((a) => a.studentId === studentId);
    const myAvg = averages.find((a) => a.studentId === studentId);

    return {
      rank: myIndex >= 0 ? myIndex + 1 : 0,
      total: classmateIds.length,
      average: myAvg?.average ?? null,
    };
  }

  static async getAnnualClassRanking(
    schemaName: string,
    studentId: string,
    academicYearId: string,
  ): Promise<{ rank: number; total: number; average: number | null }> {
    const db = getTenantDb(schemaName);
    const student = await db('students').where({ id: studentId }).first();
    if (!student?.class_id) return { rank: 0, total: 0, average: null };

    const classmates = await db('students')
      .where({ class_id: student.class_id })
      .select('id');
    const classmateIds = classmates.map((s: any) => s.id);
    const averages: { studentId: string; average: number }[] = [];

    for (const id of classmateIds) {
      const grades = await db('grades')
        .where({ student_id: id, academic_year_id: academicYearId })
        .select('value', 'coefficient', 'term');
      if (grades.length === 0) continue;

      const termMap: Record<number, { tw: number; tc: number }> = {};
      for (const g of grades) {
        const t = Number(g.term);
        if (!termMap[t]) termMap[t] = { tw: 0, tc: 0 };
        termMap[t].tw += Number(g.value) * Number(g.coefficient || 1);
        termMap[t].tc += Number(g.coefficient || 1);
      }

      const termAvgs = Object.values(termMap)
        .filter((t) => t.tc > 0)
        .map((t) => t.tw / t.tc);

      if (termAvgs.length === 0) continue;
      const annual = termAvgs.reduce((a, b) => a + b, 0) / termAvgs.length;
      averages.push({ studentId: id, average: annual });
    }

    averages.sort((a, b) => b.average - a.average);
    const myIndex = averages.findIndex((a) => a.studentId === studentId);
    const myAvg = averages.find((a) => a.studentId === studentId);

    return {
      rank: myIndex >= 0 ? myIndex + 1 : 0,
      total: classmateIds.length,
      average: myAvg?.average ?? null,
    };
  }

  static async getStudentBulletinData(
    schemaName: string,
    studentId: string,
    academicYearId: string,
    trimester: number,
  ) {
    const db = getTenantDb(schemaName);

    const student = await db('students as s')
      .join('users as u', 's.user_id', 'u.id')
      .leftJoin('classes as c', 's.class_id', 'c.id')
      .where('s.id', studentId)
      .select(
        's.id',
        's.student_code',
        'u.first_name',
        'u.last_name',
        'u.date_of_birth',
        'c.name as class_name',
        'c.level',
      )
      .first();

    if (!student) throw { status: 404, message: 'Élève non trouvé' };

    const academicYear = await db('academic_years')
      .where({ id: academicYearId })
      .first();

    const grades = await db('grades as g')
      .join('subjects as sub', 'g.subject_id', 'sub.id')
      .leftJoin('users as t', 'g.teacher_id', 't.id')
      .where({
        'g.student_id': studentId,
        'g.academic_year_id': academicYearId,
        'g.term': trimester,
      })
      .select(
        'g.*',
        'sub.name as subject_name',
        'g.coefficient',
        't.first_name as teacher_first_name',
        't.last_name as teacher_last_name',
      )
      .orderBy('sub.name');

    const subjectMap: Record<string, any> = {};
    for (const g of grades) {
      if (!subjectMap[g.subject_id]) {
        subjectMap[g.subject_id] = {
          subject_name: g.subject_name,
          coefficient: Number(g.coefficient) || 1,
          teacher:
            `${g.teacher_first_name || ''} ${g.teacher_last_name || ''}`.trim(),
          grades: [],
          comment: g.comment || '',
        };
      }
      subjectMap[g.subject_id].grades.push(Number(g.value));
      if (g.comment) subjectMap[g.subject_id].comment = g.comment;
    }

    const subjects = Object.values(subjectMap).map((s: any) => {
      const avg =
        s.grades.length > 0
          ? s.grades.reduce((a: number, b: number) => a + b, 0) /
            s.grades.length
          : null;
      return { ...s, average: avg };
    });

    let totalWeighted = 0,
      totalCoeff = 0;
    for (const s of subjects) {
      if (s.average !== null) {
        totalWeighted += s.average * s.coefficient;
        totalCoeff += s.coefficient;
      }
    }
    const generalAverage = totalCoeff > 0 ? totalWeighted / totalCoeff : null;

    const absences = await db('attendances')
      .where({ student_id: studentId, academic_year_id: academicYearId })
      .count('id as total')
      .first();

    const ranking = await BulletinService.getClassRanking(
      schemaName,
      studentId,
      academicYearId,
      trimester,
    );

    return {
      student,
      academicYear,
      trimester,
      subjects,
      generalAverage,
      mention: BulletinService.getMention(generalAverage),
      totalAbsences: Number(absences?.total || 0),
      ranking,
    };
  }

  static async getStudentAnnualData(
    schemaName: string,
    studentId: string,
    academicYearId: string,
  ) {
    const db = getTenantDb(schemaName);

    const student = await db('students as s')
      .join('users as u', 's.user_id', 'u.id')
      .leftJoin('classes as c', 's.class_id', 'c.id')
      .where('s.id', studentId)
      .select(
        's.id',
        's.student_code',
        'u.first_name',
        'u.last_name',
        'u.date_of_birth',
        'c.name as class_name',
        'c.level',
      )
      .first();

    if (!student) throw { status: 404, message: 'Élève non trouvé' };

    const academicYear = await db('academic_years')
      .where({ id: academicYearId })
      .first();

    const grades = await db('grades as g')
      .join('subjects as sub', 'g.subject_id', 'sub.id')
      .leftJoin('users as t', 'g.teacher_id', 't.id')
      .where({
        'g.student_id': studentId,
        'g.academic_year_id': academicYearId,
      })
      .select(
        'g.*',
        'sub.name as subject_name',
        'g.coefficient',
        't.first_name as teacher_first_name',
        't.last_name as teacher_last_name',
      )
      .orderBy('sub.name');

    const subjectMap: Record<string, any> = {};
    for (const g of grades) {
      if (!subjectMap[g.subject_id]) {
        subjectMap[g.subject_id] = {
          subject_name: g.subject_name,
          coefficient: Number(g.coefficient) || 1,
          teacher:
            `${g.teacher_first_name || ''} ${g.teacher_last_name || ''}`.trim(),
          t1: [],
          t2: [],
          t3: [],
        };
      }
      const term = Number(g.term);
      if (term === 1) subjectMap[g.subject_id].t1.push(Number(g.value));
      if (term === 2) subjectMap[g.subject_id].t2.push(Number(g.value));
      if (term === 3) subjectMap[g.subject_id].t3.push(Number(g.value));
    }

    const avg = (arr: number[]) =>
      arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

    const subjects = Object.values(subjectMap).map((s: any) => {
      const t1 = avg(s.t1),
        t2 = avg(s.t2),
        t3 = avg(s.t3);
      const trims = [t1, t2, t3].filter((v) => v !== null) as number[];
      const annual =
        trims.length > 0
          ? trims.reduce((a, b) => a + b, 0) / trims.length
          : null;
      return { ...s, t1, t2, t3, annual };
    });

    const calcGeneral = (key: 't1' | 't2' | 't3' | 'annual') => {
      let tw = 0,
        tc = 0;
      for (const s of subjects) {
        if (s[key] !== null) {
          tw += s[key] * s.coefficient;
          tc += s.coefficient;
        }
      }
      return tc > 0 ? tw / tc : null;
    };

    const absences = await db('attendances')
      .where({ student_id: studentId, academic_year_id: academicYearId })
      .count('id as total')
      .first();

    const avgAnnual = calcGeneral('annual');
    const ranking = await BulletinService.getAnnualClassRanking(
      schemaName,
      studentId,
      academicYearId,
    );

    return {
      student,
      academicYear,
      subjects,
      avgT1: calcGeneral('t1'),
      avgT2: calcGeneral('t2'),
      avgT3: calcGeneral('t3'),
      avgAnnual,
      mentionAnnual: BulletinService.getMention(avgAnnual),
      totalAbsences: Number(absences?.total || 0),
      ranking,
    };
  }

  static async generateBulletinPDF(
    schemaName: string,
    studentId: string,
    academicYearId: string,
    trimester: number,
  ): Promise<Buffer> {
    const data = await this.getStudentBulletinData(
      schemaName,
      studentId,
      academicYearId,
      trimester,
    );
    return BulletinService.renderPDF(this.buildBulletinHTML(data));
  }

  static async generateAnnualPDF(
    schemaName: string,
    studentId: string,
    academicYearId: string,
  ): Promise<Buffer> {
    const data = await this.getStudentAnnualData(
      schemaName,
      studentId,
      academicYearId,
    );
    return BulletinService.renderPDF(this.buildAnnualHTML(data));
  }

  private static async renderPDF(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' },
      });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  static buildBulletinHTML(data: any): string {
    const {
      student,
      academicYear,
      trimester,
      subjects,
      generalAverage,
      mention,
      totalAbsences,
      ranking,
    } = data;
    const trimesterNames: Record<number, string> = {
      1: '1er Trimestre',
      2: '2ème Trimestre',
      3: '3ème Trimestre',
    };
    const trimesterName = trimesterNames[trimester] || `Trimestre ${trimester}`;
    const avgColor =
      generalAverage === null
        ? '#6b7280'
        : generalAverage >= 14
          ? '#059669'
          : generalAverage >= 10
            ? '#d97706'
            : '#dc2626';
    const rankColor = !ranking?.rank
      ? '#6b7280'
      : ranking.rank === 1
        ? '#d97706'
        : ranking.rank <= 3
          ? '#059669'
          : '#4F46E5';
    const rankLabel = ranking?.rank
      ? `${ranking.rank}${ranking.rank === 1 ? 'er' : 'ème'} / ${ranking.total}`
      : '—';

    const subjectsRows = subjects
      .map(
        (s: any) => `
      <tr>
        <td class="subject-name">${s.subject_name}</td>
        <td class="coeff">${s.coefficient}</td>
        <td class="grade">${s.average !== null ? s.average.toFixed(2) : '—'}</td>
        <td class="grade weighted">${s.average !== null ? (s.average * s.coefficient).toFixed(2) : '—'}</td>
        <td class="appreciation">${s.comment || '—'}</td>
        <td class="teacher">${s.teacher || '—'}</td>
      </tr>`,
      )
      .join('');

    return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #1f2937; }
    .header { background: linear-gradient(135deg, #4F46E5, #7C3AED); color: white; padding: 20px 24px; border-radius: 8px; margin-bottom: 20px; }
    .header-top { display: flex; justify-content: space-between; align-items: flex-start; }
    .school-name { font-size: 22px; font-weight: bold; }
    .school-sub { font-size: 12px; opacity: 0.85; margin-top: 4px; }
    .bulletin-title { text-align: right; }
    .bulletin-title h2 { font-size: 16px; font-weight: bold; }
    .trimester-badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 12px; margin-top: 6px; }
    .student-info { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
    .info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; }
    .info-card h3 { font-size: 11px; text-transform: uppercase; color: #6b7280; font-weight: 600; margin-bottom: 10px; }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
    .info-label { color: #6b7280; } .info-value { font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    thead tr { background: #4F46E5; color: white; }
    thead th { padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; }
    tbody tr { border-bottom: 1px solid #f1f5f9; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    td { padding: 9px 12px; }
    .subject-name { font-weight: 600; } .coeff { text-align: center; color: #6b7280; }
    .grade { text-align: center; font-weight: 700; font-size: 13px; }
    .weighted { color: #4F46E5; } .appreciation { font-style: italic; font-size: 11px; } .teacher { color: #6b7280; font-size: 11px; }
    .summary { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; margin-bottom: 20px; }
    .summary-card { border-radius: 8px; padding: 14px; text-align: center; }
    .summary-card.average { background: #eff6ff; border: 2px solid #4F46E5; }
    .summary-card.mention { background: #f0fdf4; border: 2px solid #059669; }
    .summary-card.absences { background: #fff7ed; border: 2px solid #d97706; }
    .summary-card.ranking { background: #fdf4ff; border: 2px solid #a855f7; }
    .summary-label { font-size: 10px; text-transform: uppercase; color: #6b7280; font-weight: 600; margin-bottom: 6px; }
    .summary-value { font-size: 22px; font-weight: 800; }
    .summary-card.average .summary-value { color: ${avgColor}; }
    .summary-card.mention .summary-value { color: #059669; font-size: 14px; margin-top: 4px; }
    .summary-card.absences .summary-value { color: #d97706; }
    .summary-card.ranking .summary-value { color: ${rankColor}; font-size: 18px; }
    .footer { border-top: 2px solid #e2e8f0; padding-top: 16px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
    .signature-box { text-align: center; }
    .signature-label { font-size: 11px; color: #6b7280; margin-bottom: 40px; }
    .signature-line { border-top: 1px solid #9ca3af; padding-top: 6px; font-size: 11px; }
    </style></head><body>
    <div class="header"><div class="header-top">
      <div><div class="school-name">EduCore</div><div class="school-sub">Établissement scolaire · Année ${academicYear?.name || ''}</div></div>
      <div class="bulletin-title"><h2>BULLETIN DE NOTES</h2><div class="trimester-badge">${trimesterName}</div></div>
    </div></div>
    <div class="student-info">
      <div class="info-card"><h3>Informations élève</h3>
        <div class="info-row"><span class="info-label">Nom complet</span><span class="info-value">${student.last_name} ${student.first_name}</span></div>
        <div class="info-row"><span class="info-label">Code élève</span><span class="info-value">${student.student_code || '—'}</span></div>
        <div class="info-row"><span class="info-label">Date de naissance</span><span class="info-value">${student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString('fr-FR') : '—'}</span></div>
      </div>
      <div class="info-card"><h3>Scolarité</h3>
        <div class="info-row"><span class="info-label">Classe</span><span class="info-value">${student.class_name || '—'}</span></div>
        <div class="info-row"><span class="info-label">Niveau</span><span class="info-value">${student.level || '—'}</span></div>
        <div class="info-row"><span class="info-label">Année scolaire</span><span class="info-value">${academicYear?.name || '—'}</span></div>
      </div>
    </div>
    <table><thead><tr>
      <th style="width:28%">Matière</th><th style="width:8%;text-align:center">Coeff.</th>
      <th style="width:10%;text-align:center">Moyenne</th><th style="width:12%;text-align:center">Moy × Coeff</th>
      <th style="width:26%">Appréciation</th><th style="width:16%">Enseignant</th>
    </tr></thead><tbody>
      ${subjectsRows || '<tr><td colspan="6" style="text-align:center;padding:20px;color:#9ca3af;">Aucune note enregistrée</td></tr>'}
    </tbody></table>
    <div class="summary">
      <div class="summary-card average"><div class="summary-label">Moyenne Générale</div><div class="summary-value">${generalAverage !== null ? generalAverage.toFixed(2) : '—'} /20</div></div>
      <div class="summary-card mention"><div class="summary-label">Mention</div><div class="summary-value">${mention}</div></div>
      <div class="summary-card ranking"><div class="summary-label">Classement</div><div class="summary-value">${rankLabel}</div></div>
      <div class="summary-card absences"><div class="summary-label">Absences</div><div class="summary-value">${totalAbsences}</div></div>
    </div>
    <div class="footer">
      <div class="signature-box"><div class="signature-label">Signature du Directeur</div><div class="signature-line">Le Directeur</div></div>
      <div class="signature-box"><div class="signature-label">Cachet de l'établissement</div><div class="signature-line">Cachet</div></div>
      <div class="signature-box"><div class="signature-label">Signature du Parent/Tuteur</div><div class="signature-line">Lu et approuvé</div></div>
    </div></body></html>`;
  }

  static buildAnnualHTML(data: any): string {
    const {
      student,
      academicYear,
      subjects,
      avgT1,
      avgT2,
      avgT3,
      avgAnnual,
      mentionAnnual,
      totalAbsences,
      ranking,
    } = data;
    const fmt = (v: number | null) => (v !== null ? v.toFixed(2) : '—');
    const col = (v: number | null) =>
      v === null
        ? '#6b7280'
        : v >= 14
          ? '#059669'
          : v >= 10
            ? '#d97706'
            : '#dc2626';
    const annualColor = col(avgAnnual);
    const rankColor = !ranking?.rank
      ? '#6b7280'
      : ranking.rank === 1
        ? '#d97706'
        : ranking.rank <= 3
          ? '#059669'
          : '#4F46E5';
    const rankLabel = ranking?.rank
      ? `${ranking.rank}${ranking.rank === 1 ? 'er' : 'ème'} / ${ranking.total}`
      : '—';

    const subjectsRows = subjects
      .map(
        (s: any) => `
      <tr>
        <td class="subject-name">${s.subject_name}</td>
        <td class="coeff">${s.coefficient}</td>
        <td class="grade" style="color:${col(s.t1)}">${fmt(s.t1)}</td>
        <td class="grade" style="color:${col(s.t2)}">${fmt(s.t2)}</td>
        <td class="grade" style="color:${col(s.t3)}">${fmt(s.t3)}</td>
        <td class="grade annual" style="color:${col(s.annual)}">${fmt(s.annual)}</td>
        <td class="teacher">${s.teacher || '—'}</td>
      </tr>`,
      )
      .join('');

    return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #1f2937; }
    .header { background: linear-gradient(135deg, #4F46E5, #7C3AED); color: white; padding: 20px 24px; border-radius: 8px; margin-bottom: 20px; }
    .header-top { display: flex; justify-content: space-between; align-items: flex-start; }
    .school-name { font-size: 22px; font-weight: bold; }
    .school-sub { font-size: 12px; opacity: 0.85; margin-top: 4px; }
    .bulletin-title { text-align: right; }
    .bulletin-title h2 { font-size: 16px; font-weight: bold; }
    .annual-badge { display: inline-block; background: rgba(255,255,255,0.25); padding: 4px 14px; border-radius: 20px; font-size: 12px; margin-top: 6px; font-weight: 600; }
    .student-info { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
    .info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; }
    .info-card h3 { font-size: 11px; text-transform: uppercase; color: #6b7280; font-weight: 600; margin-bottom: 10px; }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
    .info-label { color: #6b7280; } .info-value { font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    thead tr:first-child { background: #4F46E5; color: white; }
    thead tr:last-child { background: #6366f1; color: white; }
    thead th { padding: 8px 10px; text-align: center; font-size: 10px; font-weight: 600; text-transform: uppercase; }
    thead th.left { text-align: left; }
    tbody tr { border-bottom: 1px solid #f1f5f9; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    td { padding: 8px 10px; }
    .subject-name { font-weight: 600; } .coeff { text-align: center; color: #6b7280; }
    .grade { text-align: center; font-weight: 700; font-size: 12px; }
    .annual { background: #eff6ff !important; font-size: 13px; border-left: 2px solid #4F46E5; border-right: 2px solid #4F46E5; }
    .teacher { color: #6b7280; font-size: 10px; }
    .summary { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 1fr; gap: 10px; margin-bottom: 16px; }
    .summary-card { border-radius: 8px; padding: 12px; text-align: center; }
    .summary-card.t1 { background: #f0f9ff; border: 2px solid #0ea5e9; }
    .summary-card.t2 { background: #fdf4ff; border: 2px solid #a855f7; }
    .summary-card.t3 { background: #fff7ed; border: 2px solid #f97316; }
    .summary-card.annual { background: #eff6ff; border: 3px solid #4F46E5; }
    .summary-card.ranking { background: #fdf4ff; border: 2px solid #a855f7; }
    .summary-label { font-size: 10px; text-transform: uppercase; color: #6b7280; font-weight: 600; margin-bottom: 6px; }
    .summary-value { font-size: 18px; font-weight: 800; }
    .summary-card.t1 .summary-value { color: #0ea5e9; }
    .summary-card.t2 .summary-value { color: #a855f7; }
    .summary-card.t3 .summary-value { color: #f97316; }
    .summary-card.annual .summary-value { color: ${annualColor}; font-size: 22px; }
    .summary-card.ranking .summary-value { color: ${rankColor}; font-size: 16px; }
    .mention-row { display: flex; gap: 12px; margin-bottom: 20px; }
    .mention-card { flex: 1; background: #f0fdf4; border: 2px solid #059669; border-radius: 8px; padding: 12px; text-align: center; }
    .absences-card { flex: 1; background: #fef2f2; border: 2px solid #ef4444; border-radius: 8px; padding: 12px; text-align: center; }
    .mention-label { font-size: 10px; text-transform: uppercase; color: #6b7280; font-weight: 600; margin-bottom: 6px; }
    .mention-value { font-size: 18px; font-weight: 800; color: #059669; }
    .absences-value { font-size: 18px; font-weight: 800; color: #ef4444; }
    .footer { border-top: 2px solid #e2e8f0; padding-top: 16px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
    .signature-box { text-align: center; }
    .signature-label { font-size: 11px; color: #6b7280; margin-bottom: 40px; }
    .signature-line { border-top: 1px solid #9ca3af; padding-top: 6px; font-size: 11px; }
    </style></head><body>
    <div class="header"><div class="header-top">
      <div><div class="school-name">EduCore</div><div class="school-sub">Établissement scolaire · Année ${academicYear?.name || ''}</div></div>
      <div class="bulletin-title"><h2>BULLETIN ANNUEL</h2><div class="annual-badge">Bilan de l'année complète</div></div>
    </div></div>
    <div class="student-info">
      <div class="info-card"><h3>Informations élève</h3>
        <div class="info-row"><span class="info-label">Nom complet</span><span class="info-value">${student.last_name} ${student.first_name}</span></div>
        <div class="info-row"><span class="info-label">Code élève</span><span class="info-value">${student.student_code || '—'}</span></div>
        <div class="info-row"><span class="info-label">Date de naissance</span><span class="info-value">${student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString('fr-FR') : '—'}</span></div>
      </div>
      <div class="info-card"><h3>Scolarité</h3>
        <div class="info-row"><span class="info-label">Classe</span><span class="info-value">${student.class_name || '—'}</span></div>
        <div class="info-row"><span class="info-label">Niveau</span><span class="info-value">${student.level || '—'}</span></div>
        <div class="info-row"><span class="info-label">Année scolaire</span><span class="info-value">${academicYear?.name || '—'}</span></div>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th class="left" style="width:26%" rowspan="2">Matière</th>
          <th style="width:7%" rowspan="2">Coeff.</th>
          <th colspan="3">Moyennes Trimestrielles</th>
          <th style="width:12%" rowspan="2">Moy. Annuelle</th>
          <th class="left" style="width:14%" rowspan="2">Enseignant</th>
        </tr>
        <tr><th style="width:10%">T1</th><th style="width:10%">T2</th><th style="width:11%">T3</th></tr>
      </thead>
      <tbody>
        ${subjectsRows || '<tr><td colspan="7" style="text-align:center;padding:20px;color:#9ca3af;">Aucune note enregistrée</td></tr>'}
        <tr style="background:#e0e7ff;font-weight:700;border-top:2px solid #4F46E5">
          <td colspan="2" style="font-weight:700">Moyenne Générale</td>
          <td class="grade" style="color:${col(avgT1)}">${fmt(avgT1)}</td>
          <td class="grade" style="color:${col(avgT2)}">${fmt(avgT2)}</td>
          <td class="grade" style="color:${col(avgT3)}">${fmt(avgT3)}</td>
          <td class="grade annual" style="color:${annualColor};font-size:14px">${fmt(avgAnnual)}</td>
          <td></td>
        </tr>
      </tbody>
    </table>
    <div class="summary">
      <div class="summary-card t1"><div class="summary-label">1er Trimestre</div><div class="summary-value">${fmt(avgT1)}</div></div>
      <div class="summary-card t2"><div class="summary-label">2ème Trimestre</div><div class="summary-value">${fmt(avgT2)}</div></div>
      <div class="summary-card t3"><div class="summary-label">3ème Trimestre</div><div class="summary-value">${fmt(avgT3)}</div></div>
      <div class="summary-card annual"><div class="summary-label">Moy. Annuelle</div><div class="summary-value">${fmt(avgAnnual)} /20</div></div>
      <div class="summary-card ranking"><div class="summary-label">Classement</div><div class="summary-value">${rankLabel}</div></div>
    </div>
    <div class="mention-row">
      <div class="mention-card"><div class="mention-label">Mention Annuelle</div><div class="mention-value">${mentionAnnual}</div></div>
      <div class="absences-card"><div class="mention-label">Total Absences</div><div class="absences-value">${totalAbsences}</div></div>
    </div>
    <div class="footer">
      <div class="signature-box"><div class="signature-label">Signature du Directeur</div><div class="signature-line">Le Directeur</div></div>
      <div class="signature-box"><div class="signature-label">Cachet de l'établissement</div><div class="signature-line">Cachet</div></div>
      <div class="signature-box"><div class="signature-label">Signature du Parent/Tuteur</div><div class="signature-line">Lu et approuvé</div></div>
    </div></body></html>`;
  }
}
