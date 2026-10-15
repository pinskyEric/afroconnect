import { text as uiText } from "@/config/brand";
export default function Loading() {
  return (
    <div className="route-loading" role="status">
      <span className="loading-dot" />
      {uiText("loading.a_little_moment")}
    </div>
  );
}
