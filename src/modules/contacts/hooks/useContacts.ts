import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchContacts } from "../services/contacts.service";

const THIRTY_MINUTES = 1000 * 60 * 30;
const TWENTY_FOUR_HOURS = 1000 * 60 * 60 * 24;

export const CONTACTS_QUERY_KEY = ["contacts"] as const;

export const contactsQueryOptions = queryOptions({
  queryKey: CONTACTS_QUERY_KEY,
  queryFn: fetchContacts,
  staleTime: THIRTY_MINUTES,
  gcTime: TWENTY_FOUR_HOURS,
});

export function useContacts() {
  return useQuery(contactsQueryOptions);
}
