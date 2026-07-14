import { MessageCircle } from 'lucide-react';
import Container from '../../components/ui/Container';
import ContactForm from '../../components/ContactForm';

export const metadata = {
  title: 'Contact',
  description: 'Écrivez à l\'équipe LTL TV.',
};

export default function ContactPage() {
  return (
    <>
      <section className="bg-brand-700 text-white py-14 md:py-20 relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 opacity-60" style={{ background: 'radial-gradient(60% 60% at 50% 40%, rgba(61,83,234,0.35), transparent 70%)' }} />
        <Container className="relative text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-brand-200 mb-6">
            <MessageCircle className="h-3 w-3" strokeWidth={2.5} />
            Nous écrire
          </div>
          <h1 className="font-bold text-display-lg">Merci de nous contacter</h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-white/80 leading-relaxed">
            Notre équipe est à votre écoute. Nous vous répondrons personnellement.
          </p>
        </Container>
      </section>

      <section className="bg-paper-100 py-14 md:py-20">
        <Container size="narrow">
          <ContactForm />
        </Container>
      </section>
    </>
  );
}
