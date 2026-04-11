import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Shield, Lock, Eye, Database, Server, UserCheck } from 'lucide-react'
import MagneticBackground from '../aitota-components/MagneticBackground'

const sections = [
  {
    icon: <Database size={24} />,
    title: "Information We Collect",
    content: (
      <>
        <p>When you use Aitota, we collect information that helps us provide and improve our services.</p>
        <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
          <li><strong>Personal Data:</strong> Name, email address, phone number, and billing information.</li>
          <li><strong>Usage Data:</strong> How you interact with our platform, API calls, and system logs.</li>
          <li><strong>Communication Data:</strong> Call recordings (if enabled by you), transcripts, and chat history processed by our AI.</li>
        </ul>
      </>
    )
  },
  {
    icon: <Lock size={24} />,
    title: "How We Use Data",
    content: (
      <p>
        We use your information exclusively to operate, maintain, and enhance the Aitota platform. Your data is used for authentication, service delivery, analytics, and customer support. <strong>We do not sell your personal data to third parties.</strong>
      </p>
    )
  },
  {
    icon: <Server size={24} />,
    title: "Data Storage & Security",
    content: (
      <p>
        Security is our top priority. All data is encrypted at rest (AES-256) and in transit (TLS 1.3). We utilize industry-leading cloud providers with SOC 2 compliance to ensure your information is stored safely in secure regional data centers.
      </p>
    )
  },
  {
    icon: <Eye size={24} />,
    title: "AI & Transcripts Processing",
    content: (
      <p>
        To provide conversational AI services, Aitota processes voice commands and text inputs. By default, audio recordings and transcripts are retained for quality assurance and training purposes unless you explicitly opt out via your account settings.
      </p>
    )
  },
  {
    icon: <UserCheck size={24} />,
    title: "Your Privacy Rights",
    content: (
      <p>
        Depending on your location (e.g., GDPR in Europe, CCPA in California), you have the right to access, modify, or delete your personal data. You can request a copy of your data or account deletion by contacting our privacy team at <a href="mailto:privacy@aitota.com" style={{ color: 'var(--accent)' }}>privacy@aitota.com</a>.
      </p>
    )
  }
]

export default function Privacy() {
  return (
    <main style={{ background: '#050510', minHeight: '100vh', paddingTop: '120px' }}>
      
      {/* Header Section */}
      <section style={{ textAlign: 'center', padding: '60px 24px', position: 'relative' }}>
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 100, border: '1px solid rgba(139, 92, 246, 0.3)', background: 'rgba(139, 92, 246, 0.05)', marginBottom: 24 }}>
            <Shield size={14} style={{ color: 'var(--accent-2)' }} />
            <span className="label" style={{ color: 'var(--accent-2)', margin: 0 }}>Privacy & Security</span>
          </div>
          <h1 className="display-huge" style={{ marginBottom: 24 }}>
            Privacy <span className="text-gradient-accent">Policy</span>
          </h1>
          <p className="body-large" style={{ color: 'var(--text-2)', maxWidth: 600, margin: '0 auto' }}>
            We are committed to protecting your personal information and your right to privacy. Last updated: March 16, 2026.
          </p>
        </motion.div>
      </section>

      {/* Content Section */}
      <section className="section-wrapper" style={{ paddingBottom: '120px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
               background: 'rgba(10, 10, 20, 0.4)',
               border: '1px solid rgba(255, 255, 255, 0.05)',
               backdropFilter: 'blur(20px)',
               borderRadius: '24px',
               padding: 'clamp(40px, 8vw, 80px) clamp(24px, 6vw, 60px)',
               boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
               position: 'relative',
               overflow: 'hidden'
            }}
          >
            {/* Subtle glow orb behind text */}
            <div style={{ position: 'absolute', top: '10%', right: '-10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(139,92,246,0.05), transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '10%', left: '-10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(0,229,255,0.03), transparent 70%)', pointerEvents: 'none' }} />

            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '60px' }}>
              
              {/* Introduction */}
              <div>
                <p style={{ color: 'var(--text-1)', fontSize: '18px', lineHeight: 1.8, marginBottom: '24px' }}>
                  Aitota ("we," "our," or "us") respects your privacy and is committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website, use our conversational AI services, and tell you about your privacy rights and how the law protects you.
                </p>
                <div style={{ height: '1px', background: 'linear-gradient(to right, rgba(255,255,255,0.1), transparent)', width: '100%', marginTop: '40px' }} />
              </div>

              {/* Mapped Sections */}
              {sections.map((section, index) => (
                <div key={index}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                    <div style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {section.icon}
                    </div>
                    <h2 style={{ fontSize: '24px', fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--text-1)', margin: 0 }}>
                      {index + 1}. {section.title}
                    </h2>
                  </div>
                  <div className="body-large" style={{ color: 'var(--text-2)', lineHeight: 1.8, fontSize: '16px', paddingLeft: '40px' }}>
                    {section.content}
                  </div>
                </div>
              ))}

              <div style={{ height: '1px', background: 'linear-gradient(to right, rgba(255,255,255,0.1), transparent)', width: '100%' }} />

              {/* Newly Added Explicit Contact Details Inline */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Shield size={24} />
                  </div>
                  <h2 style={{ fontSize: '24px', fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--text-1)', margin: 0 }}>
                    {sections.length + 1}. Contact Us
                  </h2>
                </div>
                <div className="body-large" style={{ color: 'var(--text-2)', lineHeight: 1.8, fontSize: '16px', paddingLeft: '40px' }}>
                  <p style={{ marginBottom: '16px' }}>If you have any questions about this privacy policy or our privacy practices, please contact our data privacy manager in the following ways:</p>
                  
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <li>
                      <strong style={{ color: 'var(--text-1)' }}>Email address:</strong> <a href="mailto:contact@aitota.com" style={{ color: 'var(--accent)', textDecoration: 'none' }}>contact@aitota.com</a>
                    </li>
                    <li>
                      <strong style={{ color: 'var(--text-1)' }}>Phone number:</strong> <a href="tel:+918147540362" style={{ color: 'var(--accent)', textDecoration: 'none' }}>+91 81475 40362</a>
                    </li>
                    <li>
                      <strong style={{ color: 'var(--text-1)' }}>Postal address:</strong> 
                      <span style={{ display: 'block', marginTop: '4px', fontStyle: 'normal' }}>
                        Aitota Conversational AI<br/>
                        C-116, Sector-2,<br/>
                        Noida, Uttar Pradesh – 201301,<br/>
                        India
                      </span>
                    </li>
                  </ul>
                  
                  <p style={{ marginTop: '24px', fontSize: '14px' }}>
                    You have the right to make a complaint at any time to your relevant supervisory authority for data protection issues. We would, however, appreciate the chance to deal with your concerns before you approach the authority so please contact us in the first instance.
                  </p>
                </div>
              </div>

            </div>
          </motion.div>

        </div>
      </section>
    </main>
  )
}
