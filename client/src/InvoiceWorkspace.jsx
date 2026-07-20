import { useMemo, useState } from 'react';
import { api } from './api.js';

const emptyForm = {
  companyId: '',
  branchId: '',
  contractId: '',
  candidateName: '',
  employeeCode: '',
  role: '',
  city: '',
  ctc: '',
  dateOfJoining: '',
};

export default function InvoiceWorkspace({
  companies,
  invoices,
  setInvoices,
  user,
}) {
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const company = useMemo(
    () =>
      companies.find((item) => item._id === form.companyId),
    [companies, form.companyId]
  );

  function update(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,

      ...(name === 'companyId'
        ? {
            branchId: '',
            contractId: '',
          }
        : {}),
    }));
  }

  async function submit(event) {
    event.preventDefault();

    setBusy(true);
    setMessage('');

    try {
      const result = await api.createInvoice(form);

      setInvoices((current) => [
        result.invoice,
        ...current,
      ]);

      setMessage(
        `Invoice #${result.invoice.invoiceNumber} generated.`
      );

      setForm(emptyForm);

      await api.downloadInvoice(result.invoice);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteInvoice(invoice) {
    const confirmed = window.confirm(
      `Delete invoice #${invoice.invoiceNumber} permanently?\n\n` +
        'The Excel workbook and invoice record will be removed. ' +
        'The invoice number will not be reused.'
    );

    if (!confirmed) return;

    try {
      const result = await api.deleteInvoice(invoice._id);

      setInvoices((current) =>
        current.filter((item) => item._id !== invoice._id)
      );

      setMessage(result.message);
    } catch (error) {
      setMessage(error.message);
    }
  }

  const isSuccess =
    message.includes('generated') ||
    message.includes('deleted');

  return (
    <section className="grid">
      <form className="card" onSubmit={submit}>
        <h2>Generate invoice</h2>

        <div className="fields">
          <label>
            Target company
            <select
              name="companyId"
              value={form.companyId}
              onChange={update}
              required
            >
              <option value="">Select company</option>

              {companies.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.legalName}
                </option>
              ))}
            </select>
          </label>

          <label>
            GST branch
            <select
              name="branchId"
              value={form.branchId}
              onChange={update}
              disabled={!company}
              required
            >
              <option value="">Select branch</option>

              {company?.branches.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.state} · {item.gstNo}
                </option>
              ))}
            </select>
          </label>

          <label>
            Contract / grade
            <select
              name="contractId"
              value={form.contractId}
              onChange={update}
              disabled={!company}
              required
            >
              <option value="">Select contract</option>

              {company?.contracts
                .filter((item) => item.isActive)
                .map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.grade} ·{' '}
                    {item.pricingType === 'fixed'
                      ? `₹${item.value}`
                      : `${item.value * 100}%`}
                  </option>
                ))}
            </select>
          </label>

          <label>
            CTC
            <input
              name="ctc"
              type="number"
              min="1"
              value={form.ctc}
              onChange={update}
              required
            />
          </label>

          <label>
            Candidate name
            <input
              name="candidateName"
              value={form.candidateName}
              onChange={update}
              required
            />
          </label>

          <label>
            Employee code
            <input
              name="employeeCode"
              value={form.employeeCode}
              onChange={update}
              required
            />
          </label>

          <label>
            Role
            <input
              name="role"
              value={form.role}
              onChange={update}
              required
            />
          </label>

          <label>
            Target city
            <input
              name="city"
              value={form.city}
              onChange={update}
              required
            />
          </label>

          <label>
            Date of joining
            <input
              name="dateOfJoining"
              placeholder="DD-MM-YYYY"
              value={form.dateOfJoining}
              onChange={update}
              required
            />
          </label>
        </div>

        <button disabled={busy}>
          {busy
            ? 'Generating…'
            : 'Generate & download invoice'}
        </button>

        {message && (
          <p className={isSuccess ? 'success' : 'error'}>
            {message}
          </p>
        )}
      </form>

      <aside className="card history">
        <h2>Recent invoices</h2>

        {!invoices.length ? (
          <p className="subtle">
            No invoices generated yet.
          </p>
        ) : (
          <ul>
            {invoices.map((invoice) => (
              <li key={invoice._id}>
                <div>
                  <strong>#{invoice.invoiceNumber}</strong>

                  <span>
                    {invoice.candidateName} ·{' '}
                    {invoice.company?.legalName}
                  </span>
                </div>

                <div className="row">
                  <button
                    type="button"
                    className="link-button"
                    onClick={() =>
                      api.downloadInvoice(invoice)
                    }
                  >
                    Download
                  </button>

                  {user.role === 'admin' && (
                    <button
                      type="button"
                      className="danger"
                      onClick={() => deleteInvoice(invoice)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </section>
  );
}