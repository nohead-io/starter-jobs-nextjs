"use client"

import { useSyncExternalStore } from "react"
import { LineTabsList, tabPanel, tabsRoot } from "@/components/animated-tabs"
import { Tabs, TabsContent } from "@/components/ui/tabs"

// Who to tell when a tab changes the address: replaceState fires no event.
const listeners = new Set<() => void>()

function onAddressChange(changed: () => void) {
  listeners.add(changed)
  window.addEventListener("hashchange", changed)
  return () => {
    listeners.delete(changed)
    window.removeEventListener("hashchange", changed)
  }
}

const tabInAddress = () => (location.hash === "#apply" ? "apply" : "description")

/** Puts the tab in the address, without a history entry, and shows it. */
function showTab(value: string) {
  // The router's own state stays with the entry.
  history.replaceState(history.state, "", value === "apply" ? "#apply" : location.pathname + location.search)
  for (const changed of listeners) changed()
}

/**
 * A job's description and its application form, as two tabs. The address
 * follows the tab (#apply), so "Apply for this job" links open the form, and
 * the form stays mounted while hidden, so nothing typed into it is lost.
 */
export function JobTabs({
  description,
  apply,
  className,
}: {
  description: React.ReactNode
  apply: React.ReactNode
  className?: string
}) {
  // The address is the tab: #apply, on arrival or from a link on the page,
  // opens the form. The description while prerendering.
  const tab = useSyncExternalStore(onAddressChange, tabInAddress, () => "description")

  return (
    <Tabs
      id="apply"
      value={tab}
      onValueChange={showTab}
      className={`scroll-mt-8 ${tabsRoot} ${className ?? ""}`}
    >
      <LineTabsList
        tabs={[
          ["description", "Description"],
          ["apply", "Application"],
        ]}
      />
      <TabsContent value="description" className={`pt-5 ${tabPanel}`}>
        {description}
      </TabsContent>
      <TabsContent value="apply" keepMounted className={`pt-6 ${tabPanel}`}>
        {apply}
      </TabsContent>
    </Tabs>
  )
}
