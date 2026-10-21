import { useContent } from '../context/useContent'

function About() {
  const { content } = useContent()
  const { about } = content

  return (
    <section className="about" id="about">
      <div className="about-content">
        <h2>{about.heading}</h2>

        <p>{about.body}</p>
      </div>
    </section>
  )
}

export default About
