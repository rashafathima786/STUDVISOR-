export default function InfoCard({ title, value, subtitle }) {
  return (
    <div className="card info-card">
      <p className="info-card-title">{title}</p>
      <h2 className="info-card-value">{value}</h2>
      <p className="info-card-subtitle">{subtitle}</p>
    </div>
  )
}
