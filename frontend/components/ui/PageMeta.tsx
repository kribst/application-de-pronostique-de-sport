"use client";

import { ReactNode } from "react";

export interface PageMetaProps {
  title: string;
  description?: string;
  robots?: string;
}

export function PageMeta({ title, description, robots }: PageMetaProps) {
  const metaDescription = description || "";

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={metaDescription} />
      {robots && <meta name="robots" content={robots} />}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={metaDescription} />
    </>
  );
}
