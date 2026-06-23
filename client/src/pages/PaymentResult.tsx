import { Link, useSearchParams } from "react-router";

function PaymentResult({ status }: { status: "success" | "failure" }) {
  const [params] = useSearchParams();
  const type = params.get("type");
  const bookingId = params.get("bookingId");
  const giftId = params.get("giftId");
  const reason = params.get("reason");

  const isSuccess = status === "success";

  return (
    <section className="mx-auto max-w-3xl px-4 py-24 text-center">
      <div className={`rounded-md p-10 ${isSuccess ? "bg-[#eff8f5]" : "bg-red-50"}`}>
        <p className={`text-sm font-semibold uppercase tracking-wide ${isSuccess ? "text-[#17703a]" : "text-red-600"}`}>
          {isSuccess ? "Payment successful" : "Payment failed"}
        </p>
        <h1 className="mt-4 font-serif text-4xl font-bold text-[#101918]">
          {isSuccess ? "eSewa payment verified" : "Could not complete eSewa payment"}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-gray-600">
          {isSuccess
            ? type === "gift"
              ? "Your payment was verified and the gift has been created. Cabin gifts still need owner confirmation before the recipient can accept them."
              : "Your booking payment was verified and marked as paid."
            : `Payment was cancelled, failed, or could not be verified${reason ? `: ${reason}` : ""}.`}
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {isSuccess && type === "booking" && bookingId ? (
            <Link to={`/my-bookings/${bookingId}`} className="rounded-md bg-[#24472f] px-5 py-3 text-sm font-semibold text-white">
              View booking
            </Link>
          ) : null}
          {isSuccess && type === "gift" ? (
            <Link to="/my-gifts" className="rounded-md bg-[#24472f] px-5 py-3 text-sm font-semibold text-white">
              View gifts
            </Link>
          ) : null}
          {isSuccess && giftId ? (
            <Link to="/gift-a-stay" className="rounded-md border border-[#24472f] px-5 py-3 text-sm font-semibold text-[#24472f]">
              Send another gift
            </Link>
          ) : null}
          {!isSuccess ? (
            <>
              <Link to="/gift-a-stay" className="rounded-md bg-[#24472f] px-5 py-3 text-sm font-semibold text-white">
                Try gift payment again
              </Link>
              <Link to="/my-bookings" className="rounded-md border border-[#24472f] px-5 py-3 text-sm font-semibold text-[#24472f]">
                My bookings
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default PaymentResult;
