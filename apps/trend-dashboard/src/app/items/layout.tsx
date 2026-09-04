// Nested layouts must not render <html>/<body> - only the root layout does.
export default function ItemsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
