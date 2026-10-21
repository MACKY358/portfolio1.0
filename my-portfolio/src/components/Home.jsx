import { useContent } from '../context/useContent'
import { assetUrl } from '../lib/assets'

function Home() {
  const { content } = useContent()
  const { home } = content

  return (
    <section className="home" id="home">
      <div className="home-content">
        <h3>{home.greeting}</h3>
        <h1>{home.title}</h1>

        <p>{home.description}</p>

        <br />

        <a href={home.buttonHref} className="btn">
          {home.buttonText}
        </a>
      </div>

      <div className="home-image">
        {home.image ? <img src={assetUrl(home.image)} alt={home.imageAlt} /> : null}
      </div>
    </section>
  )
}

export default Home
