// app/food-category/[...slug]/page.tsx
import FoodCategoryBySlug from "@/components/rms/food-category/food-category-by-slug";

interface PageProps {
  params: Promise<{ slug: string[] }>;
}



// IMPORTANT: Make the component async
const Page = async ({ params }: PageProps) => {
  // Await the params since they're now a Promise in Next.js 15
  const resolvedParams = await params;
  const slugs = resolvedParams.slug || [];

  console.log("Slug array:", slugs); // Should show ["water", "softdrink"]

 

  // If no slug, redirect to main categories page
  if (slugs.length === 0 || slugs.length > 5) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Food Categories</h1>
        <p>Select a category to browse...</p>
      </div>
    );
  }

  return (
    <FoodCategoryBySlug slugs={slugs}/>
  );
};

export default Page;