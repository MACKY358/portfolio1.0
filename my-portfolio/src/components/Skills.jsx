import { useContent } from '../context/useContent'

function Skills() {
  const { content } = useContent()
  const { skills } = content

  return (
    <section className="skill" id="skills">
      <h2>{skills.heading}</h2>

      <div className="skills-box">
        {skills.items.map((skill, index) => (
          <div className="skill_box" key={`${skill.name}-${index}`}>
            <h3>{skill.name}</h3>
            <p>{skill.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default Skills
