// app/food-category/[...slug]/page.tsx
import NewMenuItemsBySlug from "@/components/rms/food-category/new-menu-items-by-slug";

interface PageProps {
  params: Promise<{ slug: string }>;
}



// IMPORTANT: Make the component async
const Page = async ({ params }: PageProps) => {
  // Await the params since they're now a Promise in Next.js 15
  const resolvedParams = await params;
  const slugs = resolvedParams.slug 

  console.log("Slug array:", slugs); // Should show ["water", "softdrink"]

 

  // If no slug, redirect to main categories page
  if (slugs.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Food Categories</h1>
        <p>Select a category to browse...</p>
      </div>
    );
  }

  return (
   <NewMenuItemsBySlug slug={slugs} />
  );
};

export default Page;