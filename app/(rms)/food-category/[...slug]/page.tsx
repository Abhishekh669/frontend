// app/food-category/[...slug]/page.tsx
import React from "react";
import { notFound } from "next/navigation";

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
  if (slugs.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Food Categories</h1>
        <p>Select a category to browse...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">
        Category: {slugs.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' → ')}
      </h1>
      
      <p className="mb-4">Full path: /food-category/{slugs.join("/")}</p>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Breadcrumbs:</h2>
        <div className="flex gap-2">
          <span>Home</span>
          <span>→</span>
          <span>Food Category</span>
          {slugs.map((slug, index) => (
            <React.Fragment key={index}>
              <span>→</span>
              <span className="font-medium">
                {slug.charAt(0).toUpperCase() + slug.slice(1)}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Category Content</h2>
        <p>This would show menu items for: <strong>{slugs.join(' / ')}</strong></p>
      </div>
    </div>
  );
};

export default Page;