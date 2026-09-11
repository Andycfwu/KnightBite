import Link from "next/link";

export default function HallLoading() {
  return <main className="livi-page livi-loading" aria-busy="true" aria-label="Loading dining hall menu">
    <div className="livi-topbar"><Link href="/" className="livi-brand">KnightBite</Link><div className="livi-skeleton livi-loadingPicker" aria-hidden="true" /></div>
    <div className="livi-content">
      <div className="livi-header"><div><h1>Loading your dining hall…</h1><p role="status">Fetching the latest menu from Rutgers.</p><Link href="/">Back to dining halls</Link></div><div className="livi-skeleton livi-loadingMeals" aria-hidden="true" /></div>
      <div className="livi-workspace" aria-hidden="true">
        <div className="livi-mapCard"><div className="livi-skeleton livi-loadingLabel" /><div className="livi-skeleton livi-loadingMap" /></div>
        <div><div className="livi-panelHeader"><div className="livi-skeleton livi-loadingTitle" /><div className="livi-skeleton livi-loadingSearch" /></div>
          <div className="livi-foodList">{[0, 1, 2, 3].map((row) => <div key={row} className="livi-loadingRow"><div className="livi-skeleton livi-loadingLabel" /><div className="livi-skeleton livi-loadingDetail" /></div>)}</div>
        </div>
      </div>
    </div>
  </main>;
}
