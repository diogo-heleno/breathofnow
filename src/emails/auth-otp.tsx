import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

type Locale = 'en' | 'pt' | 'es' | 'fr';

interface AuthOtpEmailProps {
  otpCode: string;
  magicLink?: string;
  locale?: Locale;
  type?: 'signin' | 'signup';
}

const translations: Record<Locale, {
  preview: string;
  signInTitle: string;
  signUpTitle: string;
  greeting: string;
  signInDescription: string;
  signUpDescription: string;
  codeLabel: string;
  orClickLink: string;
  signInButton: string;
  signUpButton: string;
  expiresIn: string;
  ignoreMessage: string;
  footer: string;
  securityNotice: string;
}> = {
  en: {
    preview: 'Your verification code for Breath of Now',
    signInTitle: 'Sign in to Breath of Now',
    signUpTitle: 'Welcome to Breath of Now',
    greeting: 'Hello',
    signInDescription: 'Use the code below to sign in to your account:',
    signUpDescription: 'Use the code below to complete your registration:',
    codeLabel: 'Your verification code',
    orClickLink: 'Or click the button below:',
    signInButton: 'Sign in to Breath of Now',
    signUpButton: 'Complete Registration',
    expiresIn: 'This code expires in 10 minutes.',
    ignoreMessage: "If you didn't request this email, you can safely ignore it.",
    footer: '© 2024 M21 Global, Lda. All rights reserved.',
    securityNotice: 'For your security, never share this code with anyone.',
  },
  pt: {
    preview: 'O seu código de verificação para Breath of Now',
    signInTitle: 'Iniciar sessão em Breath of Now',
    signUpTitle: 'Bem-vindo ao Breath of Now',
    greeting: 'Olá',
    signInDescription: 'Use o código abaixo para iniciar sessão na sua conta:',
    signUpDescription: 'Use o código abaixo para completar o seu registo:',
    codeLabel: 'O seu código de verificação',
    orClickLink: 'Ou clique no botão abaixo:',
    signInButton: 'Iniciar sessão',
    signUpButton: 'Completar Registo',
    expiresIn: 'Este código expira em 10 minutos.',
    ignoreMessage: 'Se não solicitou este email, pode ignorá-lo com segurança.',
    footer: '© 2024 M21 Global, Lda. Todos os direitos reservados.',
    securityNotice: 'Por sua segurança, nunca partilhe este código com ninguém.',
  },
  es: {
    preview: 'Tu código de verificación para Breath of Now',
    signInTitle: 'Iniciar sesión en Breath of Now',
    signUpTitle: 'Bienvenido a Breath of Now',
    greeting: 'Hola',
    signInDescription: 'Usa el código de abajo para iniciar sesión en tu cuenta:',
    signUpDescription: 'Usa el código de abajo para completar tu registro:',
    codeLabel: 'Tu código de verificación',
    orClickLink: 'O haz clic en el botón de abajo:',
    signInButton: 'Iniciar sesión',
    signUpButton: 'Completar Registro',
    expiresIn: 'Este código expira en 10 minutos.',
    ignoreMessage: 'Si no solicitaste este email, puedes ignorarlo con seguridad.',
    footer: '© 2024 M21 Global, Lda. Todos los derechos reservados.',
    securityNotice: 'Por tu seguridad, nunca compartas este código con nadie.',
  },
  fr: {
    preview: 'Votre code de vérification pour Breath of Now',
    signInTitle: 'Connexion à Breath of Now',
    signUpTitle: 'Bienvenue sur Breath of Now',
    greeting: 'Bonjour',
    signInDescription: 'Utilisez le code ci-dessous pour vous connecter à votre compte :',
    signUpDescription: 'Utilisez le code ci-dessous pour compléter votre inscription :',
    codeLabel: 'Votre code de vérification',
    orClickLink: 'Ou cliquez sur le bouton ci-dessous :',
    signInButton: 'Se connecter',
    signUpButton: "Compléter l'inscription",
    expiresIn: 'Ce code expire dans 10 minutes.',
    ignoreMessage: "Si vous n'avez pas demandé cet email, vous pouvez l'ignorer en toute sécurité.",
    footer: '© 2024 M21 Global, Lda. Tous droits réservés.',
    securityNotice: 'Pour votre sécurité, ne partagez jamais ce code avec personne.',
  },
};

const brandColors = {
  primary: '#5C6B54',
  primaryDark: '#4A5744',
  secondary: '#D4C5B5',
  accent: '#C4A484',
  background: '#FAFAF8',
  text: '#333333',
  textMuted: '#666666',
  border: '#E5E5E5',
};

export const AuthOtpEmail: React.FC<AuthOtpEmailProps> = ({
  otpCode,
  magicLink,
  locale = 'en',
  type = 'signin',
}) => {
  const t = translations[locale] || translations.en;
  const isSignUp = type === 'signup';

  return (
    <Html>
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with Logo */}
          <Section style={header}>
            <Img
              src="https://app.breathofnow.site/icons/icon-96x96.png"
              width="48"
              height="48"
              alt="Breath of Now"
              style={logo}
            />
            <Text style={logoText}>Breath of Now</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Heading style={heading}>
              {isSignUp ? t.signUpTitle : t.signInTitle}
            </Heading>

            <Text style={paragraph}>
              {t.greeting},
            </Text>

            <Text style={paragraph}>
              {isSignUp ? t.signUpDescription : t.signInDescription}
            </Text>

            {/* OTP Code Box */}
            <Section style={codeContainer}>
              <Text style={codeLabel}>{t.codeLabel}</Text>
              <Text style={codeBox}>{otpCode}</Text>
            </Section>

            <Text style={securityNotice}>{t.securityNotice}</Text>

            {/* Magic Link Button */}
            {magicLink && (
              <>
                <Text style={orText}>{t.orClickLink}</Text>
                <Section style={buttonContainer}>
                  <Link href={magicLink} style={button}>
                    {isSignUp ? t.signUpButton : t.signInButton}
                  </Link>
                </Section>
              </>
            )}

            <Text style={expiresText}>{t.expiresIn}</Text>

            <Text style={ignoreText}>{t.ignoreMessage}</Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>{t.footer}</Text>
            <Text style={footerLinks}>
              <Link href="https://www.breathofnow.site" style={footerLink}>
                breathofnow.site
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main: React.CSSProperties = {
  backgroundColor: brandColors.background,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container: React.CSSProperties = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  maxWidth: '600px',
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
};

const header: React.CSSProperties = {
  backgroundColor: brandColors.primary,
  padding: '32px 40px',
  textAlign: 'center' as const,
};

const logo: React.CSSProperties = {
  margin: '0 auto 8px',
  display: 'block',
};

const logoText: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: '600',
  margin: '0',
  letterSpacing: '-0.5px',
};

const content: React.CSSProperties = {
  padding: '40px',
};

const heading: React.CSSProperties = {
  color: brandColors.text,
  fontSize: '28px',
  fontWeight: '700',
  textAlign: 'center' as const,
  margin: '0 0 24px',
  letterSpacing: '-0.5px',
};

const paragraph: React.CSSProperties = {
  color: brandColors.text,
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 16px',
};

const codeContainer: React.CSSProperties = {
  backgroundColor: brandColors.background,
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  textAlign: 'center' as const,
  border: `1px solid ${brandColors.border}`,
};

const codeLabel: React.CSSProperties = {
  color: brandColors.textMuted,
  fontSize: '14px',
  margin: '0 0 12px',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
};

const codeBox: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: `2px solid ${brandColors.primary}`,
  borderRadius: '8px',
  color: brandColors.primary,
  fontSize: '36px',
  fontWeight: '700',
  letterSpacing: '8px',
  margin: '0',
  padding: '16px 24px',
  fontFamily: '"JetBrains Mono", monospace',
};

const securityNotice: React.CSSProperties = {
  color: brandColors.accent,
  fontSize: '13px',
  textAlign: 'center' as const,
  margin: '0 0 24px',
  fontStyle: 'italic' as const,
};

const orText: React.CSSProperties = {
  color: brandColors.textMuted,
  fontSize: '14px',
  textAlign: 'center' as const,
  margin: '24px 0 16px',
};

const buttonContainer: React.CSSProperties = {
  textAlign: 'center' as const,
  margin: '0 0 24px',
};

const button: React.CSSProperties = {
  backgroundColor: brandColors.primary,
  borderRadius: '8px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: '600',
  padding: '14px 32px',
  textDecoration: 'none',
  textAlign: 'center' as const,
};

const expiresText: React.CSSProperties = {
  color: brandColors.textMuted,
  fontSize: '14px',
  textAlign: 'center' as const,
  margin: '24px 0 16px',
};

const ignoreText: React.CSSProperties = {
  color: brandColors.textMuted,
  fontSize: '13px',
  textAlign: 'center' as const,
  margin: '0',
  borderTop: `1px solid ${brandColors.border}`,
  paddingTop: '24px',
};

const footer: React.CSSProperties = {
  backgroundColor: brandColors.background,
  padding: '24px 40px',
  textAlign: 'center' as const,
};

const footerText: React.CSSProperties = {
  color: brandColors.textMuted,
  fontSize: '12px',
  margin: '0 0 8px',
};

const footerLinks: React.CSSProperties = {
  margin: '0',
};

const footerLink: React.CSSProperties = {
  color: brandColors.primary,
  fontSize: '12px',
  textDecoration: 'none',
};

export default AuthOtpEmail;
