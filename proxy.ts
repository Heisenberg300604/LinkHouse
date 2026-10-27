import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest, type NextFetchEvent } from 'next/server';
const protectedRoute = createRouteMatcher(['/dashboard(.*)', '/onboarding(.*)']);
const clerk = clerkMiddleware(async (auth, request) => {
  if (protectedRoute(request))
    await auth.protect({ unauthenticatedUrl: new URL('/sign-in', request.url).href });
});
export default function proxy(request: NextRequest, event: NextFetchEvent) {
  if (!process.env.CLERK_SECRET_KEY || !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)
    return protectedRoute(request)
      ? NextResponse.redirect(new URL('/sign-in', request.url))
      : NextResponse.next();
  return clerk(request, event);
}
export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
