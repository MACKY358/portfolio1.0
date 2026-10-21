import { useContent } from '../context/useContent'

function Contact() {
  const { content } = useContent()
  const { contact } = content

  return (
    <section className="contacts" id="contacts">
      <div>
        <h2>{contact.heading}</h2>

        <div className="contact-box">
          {contact.items.map((item, index) => (
            <div className="contact_box" key={`${item.label}-${index}`}>
              <h3>{item.label}</h3>
              <p>{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Contact
