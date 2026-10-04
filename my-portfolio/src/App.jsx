
import './App.css';

function Navbar() {
  return (
    <header>
      <a href="/" className="logo">My Portfolio</a>

      <nav className="navbar">
         <a href="#home">home</a>
        <a href="#about" className="button">About</a>
        <a href="#contacts">Contact</a>
       
      </nav>
    </header>
  );
}

function Home() {
  return (
    <section className="home" id="home">
      <div className="home-content">
        <h3>Hello, I'm Mike Aljhon Trompeta</h3>
        <h1>Aspiring Web Developer</h1>

        <p>
          I create beautiful, functional, and user-friendly digital
          experiences. Passionate about turning ideas into reality
          through clean code and innovative design.
        </p>

        <br />

        <a href="#skills" className="btn">
          My Skills
        </a>
      </div>

      <div className="home-image">
        <img src="/images/Designer.png" alt="Web design illustration" />
      </div>
    </section>
  );
}

function Experiences() {
  return (
    <div className="experiences">
      <div className="box">
        <h3>N/A</h3>
        <p>Years of Experience</p>
      </div>

      <div className="box">
        <h3>N/A</h3>
        <p>Completed Projects</p>
      </div>

      <div className="box">
        <h3>N/A</h3>
        <p>Satisfied Clients</p>
      </div>
    </div>
  );
}


function Skills() {
  return (
    <section className="skill" id="skills">

      <h2>My Skills</h2>

      <div className="skills-box">

        <div className="skill_box">
          <h3>HTML</h3>
          <p>Web Structure</p>
        </div>

        <div className="skill_box">
          <h3>CSS</h3>
          <p>Web Design</p>
        </div>

        <div className="skill_box">
          <h3>JS</h3>
          <p>JavaScript</p>
        </div>

        <div className="skill_box">
          <h3>React</h3>
          <p>Frontend</p>
        </div>

      </div>

    </section>
  );
}

function About() {
  return (
    <section className="about" id="about">
      <div className="about-content">
        <h2>About Me</h2>

        <p>
          Hello! I'm Mike Aljhon Trompeta, an aspiring web developer
          who enjoys creating beautiful, functional, and user-friendly
          websites. I'm currently learning React JS, JavaScript,
          CSS, and MySQL to improve my skills and build useful
          applications.
        </p>
      </div>
    </section>
  );
}
function Contact() {
  return (
    <section className="contacts" id="contacts">

      <div>
        <h2>Contact Me</h2>

        <div className="contact-box">

          <div className="contact_box">
            <h3>Email</h3>
            <p>themail@gmail.com</p>
          </div>

          <div className="contact_box">
            <h3>Phone</h3>
            <p>0912 345 6789</p>
          </div>

          <div className="contact_box">
            <h3>github</h3>
            <p>github/snoopy09</p>
          </div>

        </div>
      </div>

    </section>
  );
}

function App() {
  return (
    <>
      <Navbar />
      <Home />
      <Experiences />
      <Skills />
      <About />
      <Contact />
    </>
  );
}

export default App;