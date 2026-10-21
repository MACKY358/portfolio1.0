import { useContent } from '../context/useContent'

function Experiences() {
  const { content } = useContent()

  return (
    <div className="experiences">
      {content.stats.map((stat, index) => (
        <div className="box" key={`${stat.label}-${index}`}>
          <h3>{stat.value}</h3>
          <p>{stat.label}</p>
        </div>
      ))}
    </div>
  )
}

export default Experiences
