export async function GET(req: Request) {
  return Response.redirect(new URL('/favicon.svg', req.url), 308);
}
