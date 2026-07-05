import { Mail, Phone, MapPin, Clock, MessageCircle } from 'lucide-react';
import Container from '../../components/ui/Container';
import ContactForm from '../../components/ContactForm';

export const metadata = {
  title: 'Contact',
  description: 'Écrivez à l\'équipe LTL TV.',
};

const infos = [
  { Icon: Mail,   label: 'Email',      value: 'contact@ltltv.com',   href: 'mailto:contact@ltltv.com' },
  { Icon: Phone,  label: 'Téléphone',  value: '+243 000 000 000',    href: 'tel:+243000000000' },
  { Icon: MapPin, label: 'Adresse',    value: 'Studios LTL TV' },
  { Icon: Clock,  label: 'Diffusion',  value: '24 heures sur 24, 7 jours sur 7' },
];

export default function ContactPage() {
  return (
    <>
      <section className="bg-brand-700 text-white py-14 md:py-20 relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 opacity-60" style={{ background: 'radial-gradient(60% 60% at 50% 40%, rgba(61,83,234,0.35), transparent 70%)' }} />
        <Container className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-brand-200 mb-6">
            <MessageCircle className="h-3 w-3" strokeWidth={2.5} />
            Nous écrire
          </div>
          <h1 className="font-bold text-display-lg max-w-3xl">Une question, un projet, une prière ?</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/80 leading-relaxed">
            Notre équipe est à votre écoute. Nous vous répondrons personnellement.
          </p>
        </Container>
      </section>

      <section className="bg-paper-100 py-14 md:py-20">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
            <div className="lg:col-span-7">
              <div className="mb-8">
                <p className="text-xs uppercase tracking-[0.2em] text-brand-500 font-bold mb-3">— Formulaire</p>
                <h2 className="font-bold text-display-md text-brand-700">Écrivez-nous</h2>
              </div>
              <ContactForm />
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-lg bg-ink-900 text-white p-8 md:p-10 sticky top-24">
                <p className="text-xs uppercase tracking-[0.2em] text-brand-300 font-bold mb-3">— Coordonnées</p>
                <h3 className="font-bold text-2xl md:text-3xl mb-8">Restons en contact</h3>
                <ul className="space-y-5">
                  {infos.map(({ Icon, label, value, href }) => (
                    <li key={label} className="flex items-start gap-4">
                      <div className="h-10 w-10 shrink-0 rounded bg-brand-500/15 flex items-center justify-center">
                        <Icon className="h-4 w-4 text-brand-300" strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-wider text-white/45 mb-1">{label}</p>
                        {href ? (
                          <a href={href} className="text-white font-medium hover:text-brand-300 transition-colors break-words">{value}</a>
                        ) : (
                          <p className="text-white font-medium">{value}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
