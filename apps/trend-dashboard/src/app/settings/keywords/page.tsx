import { createKeyword, updateKeyword } from "@/app/settings/keywords/actions";
import { naverShoppingCategories } from "@/config/naver-shopping-category";
import { getSearchTrendRows } from "@/services/search-trend-service";

export default async function KeywordSettingsPage() {
  const rows = await getSearchTrendRows({ includeInactive: true });

  return (
    <div className="space-y-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-signal">Settings</p>
        <h1 className="mt-2 text-3xl font-semibold">Keyword Management</h1>
        <p className="mt-2 text-sm text-muted">Search Trend aliases와 Shopping Insight keyword/category를 분리해서 관리합니다.</p>
      </section>

      <section className="rounded border border-line bg-white p-5 shadow-subtle">
        <h2 className="text-base font-semibold">Add Keyword</h2>
        <form action={createKeyword} className="mt-4 grid gap-3 lg:grid-cols-[1fr_130px_1.4fr_1fr_160px_80px_90px]">
          <input className="rounded border border-line px-3 py-2 text-sm" name="name" placeholder="Keyword" required />
          <select className="rounded border border-line px-3 py-2 text-sm" name="category" defaultValue="TOP">
            <option value="TOP">TOP</option>
            <option value="BOTTOM">BOTTOM</option>
            <option value="ACCESSORY">ACCESSORY</option>
          </select>
          <input className="rounded border border-line px-3 py-2 text-sm" name="aliases" placeholder="Aliases, comma separated" />
          <input className="rounded border border-line px-3 py-2 text-sm" name="shoppingKeyword" placeholder="Shopping Keyword" />
          <CategorySelect />
          <label className="flex items-center gap-2 text-sm">
            <input name="active" type="checkbox" defaultChecked />
            Active
          </label>
          <button className="rounded bg-ink px-4 py-2 text-sm font-semibold text-white" type="submit">
            Add
          </button>
        </form>
      </section>

      <section className="overflow-hidden rounded border border-line bg-white shadow-subtle">
        <table className="w-full min-w-[1240px] border-collapse text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.08em] text-muted">
            <tr>
              {["Keyword", "Category", "Aliases", "Shopping Keyword", "NAVER Category", "Active", "Search Quality", "Shopping Quality", "Save"].map((head) => (
                <th key={head} className="border-b border-line px-3 py-3 text-left font-semibold">
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-line last:border-b-0">
                <form action={updateKeyword} className="contents">
                  <td className="px-3 py-3">
                    <input type="hidden" name="id" value={row.id} />
                    <input className="w-full rounded border border-line px-2 py-2" name="name" defaultValue={row.name} />
                  </td>
                  <td className="px-3 py-3">
                    <select className="w-full rounded border border-line px-2 py-2" name="category" defaultValue={row.category}>
                      <option value="TOP">TOP</option>
                      <option value="BOTTOM">BOTTOM</option>
                      <option value="ACCESSORY">ACCESSORY</option>
                    </select>
                  </td>
                  <td className="px-3 py-3">
                    <input className="w-full rounded border border-line px-2 py-2" name="aliases" defaultValue={row.aliases.join(", ")} />
                  </td>
                  <td className="px-3 py-3">
                    <input className="w-full rounded border border-line px-2 py-2" name="shoppingKeyword" defaultValue={row.shoppingKeyword ?? row.name} />
                  </td>
                  <td className="px-3 py-3">
                    <CategorySelect value={row.naverShoppingCategory ?? undefined} />
                  </td>
                  <td className="px-3 py-3">
                    <input name="active" type="checkbox" defaultChecked={row.active} />
                  </td>
                  <td className="px-3 py-3">{row.searchDataQuality}</td>
                  <td className="px-3 py-3">{row.shoppingDataQuality}</td>
                  <td className="px-3 py-3">
                    <button className="rounded border border-line px-3 py-2 text-xs font-semibold hover:border-signal" type="submit">
                      Save
                    </button>
                  </td>
                </form>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function CategorySelect({ value }: { value?: string }) {
  return (
    <select className="w-full rounded border border-line px-2 py-2 text-sm" name="naverShoppingCategory" defaultValue={value ?? naverShoppingCategories.fashionApparel.code}>
      <option value={naverShoppingCategories.fashionApparel.code}>{naverShoppingCategories.fashionApparel.label}</option>
      <option value={naverShoppingCategories.fashionAccessory.code}>{naverShoppingCategories.fashionAccessory.label}</option>
    </select>
  );
}
