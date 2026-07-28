export function buildCourseDeepLink(courseId, origin) {
  const url = new URL("/library", origin);
  url.searchParams.set("courseId", courseId);
  return url.toString();
}
