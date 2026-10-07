import type { ReactNode } from "react";

type ArticleGridProps = {
  children: ReactNode;
};

export default function ArticleGrid({
  children,
}: ArticleGridProps) {
  return (
    <div className="article-grid">
      {children}
    </div>
  );
}