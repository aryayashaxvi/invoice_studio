import { useEffect, useState } from 'react';
import { api } from './api.js';

const emptyCompany = {
  code: '',
  legalName: '',
  isActive: true,
  invoiceSettings: {
    addressDisplayMode: 'full',
    employeeCodePrefix: '',
  },
  branches: [],
  contracts: [],
};

const emptyBranch = {
  state: '',
  stateCode: '',
  gstNo: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  billingState: '',
  pin: '',
};

const emptyContract = {
  grade: '',
  pricingType: 'fixed',
  value: '',
  isActive: true,
};

export default function AdminWorkspace({
  companies,
  refreshCompanies,
}) {
  const [draft, setDraft] = useState(emptyCompany);
  const [selectedId, setSelectedId] = useState('');
  const [message, setMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [states, setStates] = useState([]);

  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'operator',
  });

  useEffect(() => {
    api
      .users()
      .then((data) => setUsers(data.users))
      .catch(() => {});

    api
      .states()
      .then((data) => setStates(data.states))
      .catch(() => {});
  }, []);

  function choose(id) {
    const company = companies.find((item) => item._id === id);

    setSelectedId(id);

    setDraft(
      company
        ? JSON.parse(JSON.stringify(company))
        : emptyCompany
    );

    setMessage('');
  }

  function patch(key, value) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function branch(index, key, value) {
    setDraft((current) => ({
      ...current,
      branches: current.branches.map((item, i) =>
        i === index
          ? {
              ...item,
              [key]: value,
            }
          : item
      ),
    }));
  }

  function contract(index, key, value) {
    setDraft((current) => ({
      ...current,
      contracts: current.contracts.map((item, i) =>
        i === index
          ? {
              ...item,
              [key]: value,
            }
          : item
      ),
    }));
  }

  async function saveCompany(event) {
    event.preventDefault();

    try {
      const result = selectedId
        ? await api.updateCompany(selectedId, draft)
        : await api.createCompany(draft);

      await refreshCompanies();
      choose(result.company._id);
      setMessage('Company saved successfully.');
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function deactivate() {
    if (
      !selectedId ||
      !window.confirm(
        'Deactivate this company? Past invoices will remain available.'
      )
    ) {
      return;
    }

    try {
      await api.deactivateCompany(selectedId);
      await refreshCompanies();
      choose('');
      setMessage('Company deactivated.');
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function createUser(event) {
    event.preventDefault();

    try {
      const result = await api.createUser(userForm);

      setUsers((current) => [
        result.user,
        ...current,
      ]);

      setUserForm({
        name: '',
        email: '',
        password: '',
        role: 'operator',
      });
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function setUserStatus(item) {
    try {
      const result = await api.updateUserStatus(
        item.id,
        !item.isActive
      );

      setUsers((current) =>
        current.map((user) =>
          user.id === item.id ? result.user : user
        )
      );
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <section className="admin-layout">
      <aside className="card company-list">
        <div className="row">
          <h2>Companies</h2>

          <button
            className="secondary"
            onClick={() => choose('')}
          >
            New
          </button>
        </div>

        {companies.map((item) => (
          <button
            className={`company-item ${
              item._id === selectedId ? 'selected' : ''
            }`}
            key={item._id}
            onClick={() => choose(item._id)}
          >
            <strong>{item.legalName}</strong>

            <span>
              {item.code} ·{' '}
              {item.isActive ? 'Active' : 'Inactive'}
            </span>
          </button>
        ))}
      </aside>

      <div>
        <form
          className="card admin-form"
          onSubmit={saveCompany}
        >
          <div className="row">
            <h2>
              {selectedId
                ? 'Edit company'
                : 'Add company'}
            </h2>

            {selectedId && (
              <button
                className="danger"
                type="button"
                onClick={deactivate}
              >
                Deactivate
              </button>
            )}
          </div>

          <div className="fields">
            <label>
              Company code

              <input
                value={draft.code}
                onChange={(event) =>
                  patch(
                    'code',
                    event.target.value.toUpperCase()
                  )
                }
                placeholder="KOTAK_PRIME"
                required
              />
            </label>

            <label>
              Legal company name

              <input
                value={draft.legalName}
                onChange={(event) =>
                  patch(
                    'legalName',
                    event.target.value
                  )
                }
                required
              />
            </label>

            <label>
              Address style

              <select
                value={
                  draft.invoiceSettings
                    .addressDisplayMode
                }
                onChange={(event) =>
                  patch('invoiceSettings', {
                    ...draft.invoiceSettings,
                    addressDisplayMode:
                      event.target.value,
                  })
                }
              >
                <option value="full">
                  Full branch address
                </option>

                <option value="stateOnly">
                  State only
                </option>
              </select>
            </label>

            <label>
              Employee code prefix

              <input
                value={
                  draft.invoiceSettings
                    .employeeCodePrefix
                }
                onChange={(event) =>
                  patch('invoiceSettings', {
                    ...draft.invoiceSettings,
                    employeeCodePrefix:
                      event.target.value,
                  })
                }
                placeholder="Optional: Prime/"
              />
            </label>

            <label className="checkbox">
              Available for new invoices

              <input
                type="checkbox"
                checked={draft.isActive}
                onChange={(event) =>
                  patch(
                    'isActive',
                    event.target.checked
                  )
                }
              />
            </label>
          </div>

          <section className="subsection">
            <div className="row">
              <h3>GST branches</h3>

              <button
                type="button"
                className="secondary"
                onClick={() =>
                  patch('branches', [
                    ...draft.branches,
                    { ...emptyBranch },
                  ])
                }
              >
                Add branch
              </button>
            </div>

            {draft.branches.map(
              (item, index) => (
                <div
                  className="editor-block"
                  key={item._id || index}
                >
                  <button
                    type="button"
                    className="remove"
                    onClick={() =>
                      patch(
                        'branches',
                        draft.branches.filter(
                          (_, i) => i !== index
                        )
                      )
                    }
                  >
                    Remove
                  </button>

                  <div className="fields small-fields">
                    <label>
                      GST state

                      <select
                        value={item.state || ''}
                        onChange={(event) =>
                          branch(
                            index,
                            'state',
                            event.target.value
                          )
                        }
                        required
                      >
                        <option value="">
                          Select state
                        </option>

                        {states.map((state) => (
                          <option
                            key={state._id}
                            value={state.name}
                          >
                            {state.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      State code

                      <input
                        value={
                          item.stateCode || ''
                        }
                        onChange={(event) =>
                          branch(
                            index,
                            'stateCode',
                            event.target.value
                          )
                        }
                        required
                      />
                    </label>

                    <label>
                      GSTIN

                      <input
                        value={item.gstNo || ''}
                        onChange={(event) =>
                          branch(
                            index,
                            'gstNo',
                            event.target.value
                          )
                        }
                        required
                      />
                    </label>

                    <label>
                      Address line 1

                      <input
                        value={
                          item.addressLine1 || ''
                        }
                        onChange={(event) =>
                          branch(
                            index,
                            'addressLine1',
                            event.target.value
                          )
                        }
                      />
                    </label>

                    <label>
                      Address line 2

                      <input
                        value={
                          item.addressLine2 || ''
                        }
                        onChange={(event) =>
                          branch(
                            index,
                            'addressLine2',
                            event.target.value
                          )
                        }
                      />
                    </label>

                    <label>
                      City

                      <input
                        value={item.city || ''}
                        onChange={(event) =>
                          branch(
                            index,
                            'city',
                            event.target.value
                          )
                        }
                      />
                    </label>

                    <label>
                      Billing state

                      <select
                        value={
                          item.billingState || ''
                        }
                        onChange={(event) =>
                          branch(
                            index,
                            'billingState',
                            event.target.value
                          )
                        }
                      >
                        <option value="">
                          Select billing state
                        </option>

                        {states.map((state) => (
                          <option
                            key={state._id}
                            value={state.name}
                          >
                            {state.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      PIN

                      <input
                        value={item.pin || ''}
                        onChange={(event) =>
                          branch(
                            index,
                            'pin',
                            event.target.value
                          )
                        }
                      />
                    </label>
                  </div>
                </div>
              )
            )}
          </section>

          <section className="subsection">
            <div className="row">
              <h3>Contract details</h3>

              <button
                type="button"
                className="secondary"
                onClick={() =>
                  patch('contracts', [
                    ...draft.contracts,
                    { ...emptyContract },
                  ])
                }
              >
                Add contract
              </button>
            </div>

            {draft.contracts.map(
              (item, index) => (
                <div
                  className="editor-block compact"
                  key={item._id || index}
                >
                  <button
                    type="button"
                    className="remove"
                    onClick={() =>
                      patch(
                        'contracts',
                        draft.contracts.filter(
                          (_, i) => i !== index
                        )
                      )
                    }
                  >
                    Remove
                  </button>

                  <div className="fields small-fields">
                    <label>
                      Grade

                      <input
                        value={item.grade}
                        onChange={(event) =>
                          contract(
                            index,
                            'grade',
                            event.target.value
                          )
                        }
                        required
                      />
                    </label>

                    <label>
                      Pricing

                      <select
                        value={item.pricingType}
                        onChange={(event) =>
                          contract(
                            index,
                            'pricingType',
                            event.target.value
                          )
                        }
                      >
                        <option value="fixed">
                          Fixed amount
                        </option>

                        <option value="percentage">
                          Percentage of CTC
                        </option>
                      </select>
                    </label>

                    <label>
                      {item.pricingType === 'fixed'
                        ? 'Amount (₹)'
                        : 'Rate (e.g. 0.0833)'}

                      <input
                        type="number"
                        step="0.0001"
                        min="0.0001"
                        value={item.value}
                        onChange={(event) =>
                          contract(
                            index,
                            'value',
                            event.target.value
                          )
                        }
                        required
                      />
                    </label>

                    <label className="checkbox">
                      Active

                      <input
                        type="checkbox"
                        checked={item.isActive}
                        onChange={(event) =>
                          contract(
                            index,
                            'isActive',
                            event.target.checked
                          )
                        }
                      />
                    </label>
                  </div>
                </div>
              )
            )}
          </section>

          <button>Save company</button>

          {message && (
            <p
              className={
                message.includes('success')
                  ? 'success'
                  : 'error'
              }
            >
              {message}
            </p>
          )}
        </form>

        <section className="card users">
          <h2>User access</h2>

          <form
            className="inline-form"
            onSubmit={createUser}
          >
            <input
              placeholder="Name"
              value={userForm.name}
              onChange={(event) =>
                setUserForm({
                  ...userForm,
                  name: event.target.value,
                })
              }
              required
            />

            <input
              type="email"
              placeholder="Email"
              value={userForm.email}
              onChange={(event) =>
                setUserForm({
                  ...userForm,
                  email: event.target.value,
                })
              }
              required
            />

            <input
              type="password"
              minLength="8"
              placeholder="Temporary password"
              value={userForm.password}
              onChange={(event) =>
                setUserForm({
                  ...userForm,
                  password: event.target.value,
                })
              }
              required
            />

            <select
              value={userForm.role}
              onChange={(event) =>
                setUserForm({
                  ...userForm,
                  role: event.target.value,
                })
              }
            >
              <option value="operator">
                Invoice operator
              </option>

              <option value="admin">
                Admin
              </option>
            </select>

            <button>Add user</button>
          </form>

          <ul>
            {users.map((item) => (
              <li key={item.id}>
                <span>
                  {item.name} · {item.email} ·{' '}
                  {item.role}
                </span>

                <button
                  className="secondary"
                  type="button"
                  onClick={() =>
                    setUserStatus(item)
                  }
                >
                  {item.isActive
                    ? 'Deactivate'
                    : 'Activate'}
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  );
}