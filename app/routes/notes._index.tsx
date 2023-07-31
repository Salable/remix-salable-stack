import { LoaderArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { Salable } from "@salable/node-sdk";
import { SalablePricingTableReact } from "@salable/react-sdk";
import { requireUserId } from "~/session.server";
import { useUser } from "~/utils";

export const loader = async ({ request }: LoaderArgs) => {
  const userId = await requireUserId(request);
  const apiKey = process.env.SALABLE_API_KEY as string;
  const productId = process.env.SALABLE_PRODUCT_ID as string;
  const { licenses } = new Salable(apiKey);

  try {
    const capabilitiesCheck = await licenses.check(productId, [
      userId,
    ])

    return { perms: capabilitiesCheck, apiKey, productId }
  } catch (error) {
    return { perms: { capabilities: [] as string[] }, apiKey, productId }
  }
}

export default function NoteIndexPage() {
  const user = useUser();
  const { perms, apiKey, productId: productUuid } = useLoaderData<typeof loader>();
  const hasPermission = perms?.capabilities?.includes('Thing');

  return (
    <>
      <p>
        No note selected. Select a note on the left, or{" "}
        {hasPermission ? (
          <Link to="new" className="text-blue-500 underline">
            create a new note.
          </Link>
        ) : (
          <>subscribe to pro to create one.</>
        )}
      </p>
      {!hasPermission ? (
        <SalablePricingTableReact
          envConfig={{
            productUuid,
            apiKey,
            globalPlanOptions: {
              granteeId: user.id,
              successUrl: '/notes',
              cancelUrl: '/notes'
            },
            theme: 'light'
          }}
          checkoutConfig={{
            member: user.id,
            customer: {
              email: user.email,
            },
          }}
        />

      ) : null}
    </>
  );
}
