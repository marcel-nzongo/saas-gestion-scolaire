// ============================================================
// AJOUTER cette méthode dans la classe BulletinService
// dans apps/academic-service/src/services/bulletin.service.ts
// APRÈS la méthode getMention()
// ============================================================

  static async getClassRanking(
    schemaName: string,
    studentId: string,
    academicYearId: string,
    trimester: number,
  ): Promise<{ rank: number; total: number; average: number | null }> {
    const db = getTenantDb(schemaName);

    // Trouver la classe de l'élève
    const student = await db('students').where({ id: studentId }).first();
    if (!student?.class_id) return { rank: 0, total: 0, average: null };

    // Tous les élèves de la même classe
    const classmates = await db('students').where({ class_id: student.class_id }).select('id');
    const classmateIds = classmates.map((s: any) => s.id);

    // Calculer la moyenne de chaque élève
    const averages: { studentId: string; average: number }[] = [];

    for (const id of classmateIds) {
      const grades = await db('grades')
        .where({ student_id: id, academic_year_id: academicYearId, term: trimester })
        .select('value', 'coefficient');

      if (grades.length === 0) continue;

      let tw = 0, tc = 0;
      for (const g of grades) {
        tw += Number(g.value) * Number(g.coefficient || 1);
        tc += Number(g.coefficient || 1);
      }
      if (tc > 0) averages.push({ studentId: id, average: tw / tc });
    }

    // Trier par moyenne décroissante
    averages.sort((a, b) => b.average - a.average);

    const myIndex = averages.findIndex((a) => a.studentId === studentId);
    const myAvg = averages.find((a) => a.studentId === studentId);

    return {
      rank: myIndex >= 0 ? myIndex + 1 : 0,
      total: classmateIds.length,
      average: myAvg?.average ?? null,
    };
  }

// ============================================================
// AJOUTER aussi cette route dans bulletin.routes.ts :
// router.get('/:studentId/ranking', BulletinController.getRanking);
//
// AJOUTER cette méthode dans bulletin.controller.ts :
//
//   static async getRanking(req: Request, res: Response) {
//     try {
//       const { studentId } = req.params;
//       const { academic_year_id, trimester } = req.query;
//       if (!academic_year_id || !trimester) {
//         return res.status(400).json({ success: false, message: 'Paramètres manquants' });
//       }
//       const data = await BulletinService.getClassRanking(
//         getSchema(req), studentId,
//         academic_year_id as string,
//         parseInt(trimester as string),
//       );
//       res.json({ success: true, data });
//     } catch (error: any) {
//       res.status(500).json({ success: false, message: error.message });
//     }
//   }
// ============================================================
