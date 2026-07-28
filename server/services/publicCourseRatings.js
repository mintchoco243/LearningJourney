import { query } from "../db.js";

function normalizeCourseId(value) {
  return value == null ? "" : String(value);
}

function normalizeRating(value) {
  const rating = Number(value);
  return Number.isFinite(rating) && rating > 0 ? rating : null;
}

export async function attachPublicCourseRatings(rows, getCourseId = (row) => row.id || row.course_id) {
  const items = Array.isArray(rows) ? rows : [];
  const courseIds = Array.from(new Set(items.map(getCourseId).map(normalizeCourseId).filter(Boolean)));
  if (!courseIds.length) return items;

  const placeholders = courseIds.map((_, index) => `$${index + 1}`).join(", ");
  const featured = await query(
    `SELECT course_id, COUNT(*) AS featured_testimonial_count
     FROM testimonials
     WHERE is_featured = TRUE AND course_id IN (${placeholders})
     GROUP BY course_id`,
    courseIds
  );
  const featuredCounts = new Map(
    (featured.rows || []).map((row) => [normalizeCourseId(row.course_id), Number(row.featured_testimonial_count || 0)])
  );

  return items.map((row) => {
    const courseId = normalizeCourseId(getCourseId(row));
    const featuredCount = featuredCounts.get(courseId) || 0;
    return {
      ...row,
      featured_testimonial_count: featuredCount,
      has_featured_testimonial: featuredCount > 0,
      rating: normalizeRating(row.rating),
    };
  });
}
