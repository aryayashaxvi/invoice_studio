import OrganizationSettings from '../models/OrganizationSettings.js';

export async function getOrganizationSettings() {
  return OrganizationSettings.findOneAndUpdate({ key: 'default' }, { $setOnInsert: { key: 'default' } }, { new: true, upsert: true, setDefaultsOnInsert: true });
}
