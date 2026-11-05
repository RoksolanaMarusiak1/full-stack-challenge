import { Form, useNavigation } from "react-router";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

type UrlFormProps = {
  error?: string;
};

export function UrlForm({ error }: UrlFormProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <Form method="post" noValidate className="flex flex-col gap-3">
      <label htmlFor="url" className="text-sm font-medium">
        Paste a long URL
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          id="url"
          name="url"
          type="text"
          inputMode="url"
          autoComplete="off"
          placeholder="https://example.com/some/very/long/path"
          invalid={Boolean(error)}
          aria-describedby={error ? "url-error" : undefined}
          disabled={isSubmitting}
        />
        <Button type="submit" disabled={isSubmitting} className="sm:w-40">
          {isSubmitting ? "Shortening…" : "Shorten"}
        </Button>
      </div>
      {error && (
        <p id="url-error" role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </Form>
  );
}
