import { useEffect, useState } from 'react';
import { api, setToken } from './api.js';
import LoginPage from './LoginPage.jsx';
import InvoiceWorkspace from './InvoiceWorkspace.jsx';
import AdminWorkspace from './AdminWorkspace.jsx';
import OrganizationSettings from './OrganizationSettings.jsx';
export default function App() { const [user, setUser] = useState(null); const [companies, setCompanies] = useState([]); const [invoices, setInvoices] = useState([]); const [view, setView] = useState('invoices'); const [error, setError] = useState(''); const refreshCompanies = async () => { const data = await api.companies(user?.role === 'admin'); setCompanies(data.companies); };
  useEffect(() => { if (!localStorage.getItem('invoice_token')) return; api.me().then(({ user: currentUser }) => setUser(currentUser)).catch(() => setToken(null)); }, []);
  useEffect(() => { if (!user) return; Promise.all([refreshCompanies(), api.invoices()]).then(([, invoiceData]) => setInvoices(invoiceData.invoices)).catch((e) => setError(e.message)); }, [user]);
  async function login(credentials) { try { setError(''); const result = await api.login(credentials); setToken(result.token); setUser(result.user); } catch (e) { setError(e.message); } }
  if (!user) return <LoginPage onLogin={login} error={error} />;
  return <main className="shell"><header><div><p className="eyebrow">SECURE OPERATIONS PORTAL</p><h1>Invoice Studio</h1><p className="subtle">Signed in as {user.name} · {user.role}</p></div><button className="secondary" onClick={() => { setToken(null); setUser(null); }}>Sign out</button></header><nav>{['invoices', ...(user.role === 'admin' ? ['admin', 'settings'] : [])].map((item) => <button className={view === item ? 'nav-active' : 'secondary'} key={item} onClick={() => setView(item)}>{item === 'admin' ? 'Company & access management' : item === 'settings' ? 'Organisation settings' : 'Invoice workspace'}</button>)}</nav>{view === 'admin' ? <AdminWorkspace companies={companies} refreshCompanies={refreshCompanies} /> : view === 'settings' ? <OrganizationSettings /> : <InvoiceWorkspace companies={companies.filter((item) => item.isActive)} invoices={invoices} setInvoices={setInvoices} />}</main>; }
