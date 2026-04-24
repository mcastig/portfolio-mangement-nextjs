import './auth.css';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-layout">
      <aside className="auth-panel">
        <img src="/login-bg.png" alt="" className="auth-panel-bg" aria-hidden="true" />
        <div className="auth-panel-content">
          <h2>Easy Portfolio for Developer</h2>
          <p>
            As a web developer, having a portfolio is essential for showcasing your technical skills
            and attracting potential clients. A portfolio is a museum of your work, with past tech
            stacks, case studies, and your work history.
          </p>
        </div>
      </aside>
      <main className="auth-main">
        {children}
      </main>
    </div>
  );
}
