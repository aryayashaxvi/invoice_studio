import { useEffect, useState } from 'react';
import { api } from './api.js';

const blankSettings = {
  homeState: '',
  invoiceStartNumber: '',
  taxes: {
    cgstRate: '',
    sgstRate: '',
    igstRate: '',
  },
  templates: {
    intraState: '',
    interstate: '',
  },
  issuer: {
    legalName: '',
    gstNumber: '',
    registeredAddress: '',
    bankAccountNumber: '',
    bankAccountType: '',
    bankNameAndAddress: '',
    ifscCode: '',
    panNumber: '',
    signatoryCompanyName: '',
  },
};

export default function OrganizationSettings() {
  const [settings, setSettings] = useState(blankSettings);
  const [states, setStates] = useState([]);
  const [newState, setNewState] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  async function loadData() {
    try {
      const [settingsResponse, statesResponse] = await Promise.all([
        api.organizationSettings(),
        api.states(true),
      ]);

      const savedSettings = settingsResponse.settings;

      setSettings({
        ...blankSettings,
        ...savedSettings,
        taxes: {
          ...blankSettings.taxes,
          ...savedSettings.taxes,
        },
        templates: {
          ...blankSettings.templates,
          ...savedSettings.templates,
        },
        issuer: {
          ...blankSettings.issuer,
          ...savedSettings.issuer,
        },
      });

      setStates(statesResponse.states);
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function updateIssuer(field, value) {
    setSettings((current) => ({
      ...current,
      issuer: {
        ...current.issuer,
        [field]: value,
      },
    }));
  }

  function updateTax(field, value) {
    setSettings((current) => ({
      ...current,
      taxes: {
        ...current.taxes,
        [field]: value,
      },
    }));
  }

  function updateTemplate(field, value) {
    setSettings((current) => ({
      ...current,
      templates: {
        ...current.templates,
        [field]: value,
      },
    }));
  }

  async function saveSettings(event) {
    event.preventDefault();

    setSaving(true);
    setMessage('');

    try {
      const { settings: savedSettings } =
        await api.updateOrganizationSettings(settings);

      setSettings(savedSettings);
      setMessage('Organisation settings saved.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function addState(event) {
    event.preventDefault();

    try {
      await api.createState({ name: newState });

      setNewState('');
      await loadData();

      setMessage('State added.');
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function saveState(state) {
    try {
      await api.updateState(state._id, {
        name: state.name,
      });

      await loadData();
      setMessage('State updated.');
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function deactivateState(state) {
    const confirmed = window.confirm(
      `Deactivate "${state.name}"? Existing invoices will remain unchanged.`
    );

    if (!confirmed) return;

    try {
      await api.deactivateState(state._id);

      await loadData();
      setMessage('State deactivated.');
    } catch (error) {
      setMessage(error.message);
    }
  }

  function updateLocalState(index, value) {
    setStates((current) =>
      current.map((state, stateIndex) =>
        stateIndex === index
          ? { ...state, name: value }
          : state
      )
    );
  }

  const isSuccess =
    message.toLowerCase().includes('saved') ||
    message.toLowerCase().includes('added') ||
    message.toLowerCase().includes('updated') ||
    message.toLowerCase().includes('deactivated');

  return (
    <>
      <form className="card settings-form" onSubmit={saveSettings}>
        <h2>Organisation settings</h2>

        <p className="subtle">
          These values are inserted into the Excel invoice templates. Complete
          every field before generating invoices.
        </p>

        <h3>Invoice and tax configuration</h3>

        <div className="fields">
          <label>
            Home state
            <select
              value={settings.homeState}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  homeState: event.target.value,
                }))
              }
              required
            >
              <option value="">Select home state</option>

              {states
                .filter((state) => state.isActive)
                .map((state) => (
                  <option key={state._id} value={state.name}>
                    {state.name}
                  </option>
                ))}
            </select>
          </label>

          <label>
            First invoice number
            <input
              type="number"
              min="1"
              value={settings.invoiceStartNumber}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  invoiceStartNumber: event.target.value,
                }))
              }
              required
            />
          </label>

          <label>
            Intra-state template
            <select
              value={settings.templates.intraState}
              onChange={(event) =>
                updateTemplate('intraState', event.target.value)
              }
              required
            >
              <option value="">Select template</option>
              <option value="template1.xlsx">Template 1</option>
              <option value="template2.xlsx">Template 2</option>
            </select>
          </label>

          <label>
            Interstate template
            <select
              value={settings.templates.interstate}
              onChange={(event) =>
                updateTemplate('interstate', event.target.value)
              }
              required
            >
              <option value="">Select template</option>
              <option value="template1.xlsx">Template 1</option>
              <option value="template2.xlsx">Template 2</option>
            </select>
          </label>

          <label>
            CGST rate
            <input
              type="number"
              min="0"
              max="1"
              step="0.0001"
              placeholder="0.09 for 9%"
              value={settings.taxes.cgstRate}
              onChange={(event) =>
                updateTax('cgstRate', event.target.value)
              }
              required
            />
          </label>

          <label>
            SGST rate
            <input
              type="number"
              min="0"
              max="1"
              step="0.0001"
              placeholder="0.09 for 9%"
              value={settings.taxes.sgstRate}
              onChange={(event) =>
                updateTax('sgstRate', event.target.value)
              }
              required
            />
          </label>

          <label>
            IGST rate
            <input
              type="number"
              min="0"
              max="1"
              step="0.0001"
              placeholder="0.18 for 18%"
              value={settings.taxes.igstRate}
              onChange={(event) =>
                updateTax('igstRate', event.target.value)
              }
              required
            />
          </label>
        </div>

        <h3>Issuer details for the Excel template</h3>

        <div className="fields">
          <label>
            Organisation / issuer legal name
            <input
              value={settings.issuer.legalName}
              onChange={(event) =>
                updateIssuer('legalName', event.target.value)
              }
              required
            />
          </label>

          <label>
            Issuer GST number
            <input
              value={settings.issuer.gstNumber}
              onChange={(event) =>
                updateIssuer(
                  'gstNumber',
                  event.target.value.toUpperCase()
                )
              }
              required
            />
          </label>

          <label className="wide-field">
            Registered address
            <textarea
              value={settings.issuer.registeredAddress}
              onChange={(event) =>
                updateIssuer('registeredAddress', event.target.value)
              }
              required
            />
          </label>

          <label>
            Bank account number
            <input
              value={settings.issuer.bankAccountNumber}
              onChange={(event) =>
                updateIssuer('bankAccountNumber', event.target.value)
              }
              required
            />
          </label>

          <label>
            Account type
            <input
              placeholder="For example: Current Account"
              value={settings.issuer.bankAccountType}
              onChange={(event) =>
                updateIssuer('bankAccountType', event.target.value)
              }
              required
            />
          </label>

          <label className="wide-field">
            Bank name and address
            <textarea
              value={settings.issuer.bankNameAndAddress}
              onChange={(event) =>
                updateIssuer('bankNameAndAddress', event.target.value)
              }
              required
            />
          </label>

          <label>
            IFSC code
            <input
              value={settings.issuer.ifscCode}
              onChange={(event) =>
                updateIssuer(
                  'ifscCode',
                  event.target.value.toUpperCase()
                )
              }
              required
            />
          </label>

          <label>
            PAN number
            <input
              value={settings.issuer.panNumber}
              onChange={(event) =>
                updateIssuer(
                  'panNumber',
                  event.target.value.toUpperCase()
                )
              }
              required
            />
          </label>

          <label>
            Signatory company name
            <input
              value={settings.issuer.signatoryCompanyName}
              onChange={(event) =>
                updateIssuer(
                  'signatoryCompanyName',
                  event.target.value
                )
              }
              required
            />
          </label>
        </div>

        <button disabled={saving}>
          {saving ? 'Saving…' : 'Save organisation settings'}
        </button>

        {message && (
          <p className={isSuccess ? 'success' : 'error'}>
            {message}
          </p>
        )}
      </form>

      <section className="card settings-form">
        <h2>State directory</h2>

        <p className="subtle">
          Add states here once. They will appear in the home-state and GST
          branch dropdowns.
        </p>

        <form className="inline-form" onSubmit={addState}>
          <input
            placeholder="For example: Haryana"
            value={newState}
            onChange={(event) => setNewState(event.target.value)}
            required
          />

          <button>Add state</button>
        </form>

        <div className="state-list">
          {states.length === 0 && (
            <p className="subtle">
              No states have been added yet.
            </p>
          )}

          {states.map((state, index) => (
            <div className="row" key={state._id}>
              <input
                value={state.name}
                disabled={!state.isActive}
                onChange={(event) =>
                  updateLocalState(index, event.target.value)
                }
              />

              {state.isActive ? (
                <>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => saveState(state)}
                  >
                    Save
                  </button>

                  <button
                    type="button"
                    className="danger"
                    onClick={() => deactivateState(state)}
                  >
                    Deactivate
                  </button>
                </>
              ) : (
                <span className="subtle">Inactive</span>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}