import { KnightBiteBrand } from "@/components/layout/KnightBiteBrand";

export default function Loading() {
  return <main className="livi-page home-page home-loading" aria-label="Loading campus dining" aria-busy="true">
    <div className="livi-topbar home-topbar"><KnightBiteBrand /></div>
    <div className="home-content" aria-hidden="true">
      <div className="home-serviceBar"><div className="livi-skeleton livi-loadingPicker" /></div>
      <div className="home-hero"><div><div className="livi-skeleton livi-loadingTitle" /><div className="livi-skeleton livi-loadingSearch" /></div><div className="livi-skeleton livi-loadingMeals" /></div>
      <div className="home-hallGrid">{[0, 1, 2, 3].map((card) => <div key={card} className="home-loadingCard">
        <div className="livi-skeleton home-loadingMap" /><div className="home-loadingBody"><div className="livi-skeleton livi-loadingLabel" /><div className="livi-skeleton livi-loadingDetail" /><div className="livi-skeleton livi-loadingSearch" /></div>
      </div>)}</div>
    </div>
    <p className="sr-only" role="status">Loading dining halls…</p>
  </main>;
}
