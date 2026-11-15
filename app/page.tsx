import { getContent } from "@/lib/content";
import { Well } from "@/components/Well";

export default function Page() {
  return <Well content={getContent()} />;
}
