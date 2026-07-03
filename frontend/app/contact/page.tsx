import { Mail, Phone, MapPin, Clock, MessageCircle } from 'lucide-react';
import Container from '../../components/ui/Container';
import ContactForm from '../../components/ContactForm';

export const metadata = {
  title: 'Contact',
  description: 'Écrivez à l\'équipe LTL TV. Nous vous répondrons dans les plus brefs délais.',
};

const infos = [
  {
    Icon: Mail,
    label: 'Email',
    value: 'contact@ltltv.com',
    href: 'mailto:contact@ltltv.com',
  },
  {
    Icon: Phone,
    label: 'Téléphone',
    value: '+243 000 000 000',
    href: 'tel:+243000000000',
  },
  {
    Icon: MapPin,
    label: 'Adresse',
    value: 'Studios LTL TV',
  },
  {
    Icon: Clock,
    label: 'Diffusion',
    value: '24 heures sur 24, 7 jours sur 7',
  },
];

export default function ContactPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-ink-900 text-cream-50 pt-24 pb-20 md:pt-32 md:pb-28 relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 opacity-60" style={{ background: 'radial-gradient(60% 60% at 50% 40%, rgba(245,166,35,0.12), transparent 70%)' }} />
        <Container className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/5 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-gold-400 mb-8">
            <MessageCircle className="h-3 w-3" strokeWidth={2.5} />
            Nous écrire
          </div>
          <h1 className="font-serif text-display-lg font-medium max-w-3xl">
            Une question, un projet, une <span className="italic text-gold-400">prière</span> ?
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-cream-100/80 leading-relaxed">
            Notre équipe est à votre écoute. Écrivez-nous — nous vous
            répondrons personnellement.
          </p>
        </Container>
      </section>

      {/* Form + infos */}
      <section className="bg-cream-50 py-20 md:py-24">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
            {/* Form */}
            <div className="lg:col-span-7">
              <div className="mb-10">
                <p className="text-xs uppercase tracking-[0.2em] text-gold-600 mb-4">— Formulaire</p>
                <h2 className="font-serif text-display-md font-medium text-ink-900">
                  Écrivez-nous
                </h2>
              </div>
              <ContactForm />
            </div>

            {/* Infos */}
            <div className="lg:col-span-5">
              <div className="rounded-lg bg-ink-900 text-cream-50 p-8 md:p-10 sticky top-28">
                <p className="text-xs uppercase tracking-[0.2em] text-gold-400 mb-4">— Coordonnées</p>
                <h3 className="font-serif text-3xl font-medium mb-8">
                  Restons en contact
                </h3>
                <ul className="space-y-6">
                  {infos.map(({ Icon, label, value, href }) => (
                    <li key={label} className="flex items-start gap-4">
                      <div className="h-10 w-10 shrink-0 rounded bg-gold-500/15 flex items-center justify-center">
                        <Icon className="h-4 w-4 text-gold-400" strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-wider text-cream-100/50 mb-1">{label}</p>
                        {href ? (
                          <a href={href} className="text-cream-50 font-medium hover:text-gold-400 transition-colors break-words">
                            {value}
                          </a>
                        ) : (
                          <p className="text-cream-50 font-medium">{value}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="mt-10 pt-8 border-t border-cream-100/10">
                  <p className="font-serif italic text-cream-100/70 leading-relaxed">
                    « La lumière qui inspire la vie. »
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
