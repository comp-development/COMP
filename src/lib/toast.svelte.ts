import { writable, type Writable } from "svelte/store";

class Toaster {
  state: Map<
    number,
    {
      status: "success" | "error" | "warning";
      message: string;
      toastStatus: Writable<boolean>;
    }
  > = $state(new Map());
  timeout: number;
  index: number = 0;

  subscribers: { (): void }[] = [];

  constructor(timeout: number) {
    this.timeout = timeout;
  }

  get messages(): Map<
    number,
    {
      status: "success" | "error" | "warning";
      message: string;
      toastStatus: Writable<boolean>;
    }
  > {
    return this.state;
  }

  trigger_subscribers() {
    for (const s of this.subscribers) {
      s();
    }
  }

  subscribe(callback: { (): void }) {
    this.subscribers.push(callback);
  }

  add_message(
    data: { status: "success" | "error" | "warning"; message: string },
    timeout: number | null,
  ) {
    const i = this.index;
    this.index += 1;
    this.state.set(i, { toastStatus: writable(false), ...data });
    this.state = this.state;
    this.trigger_subscribers();
    const t = timeout ?? this.timeout;
    setTimeout(
      (() => {
        this.state.get(i)!.toastStatus.set(true);
      }).bind(this),
      100,
    );
    setTimeout(
      (() => {
        this.state.get(i)!.toastStatus.set(false);
      }).bind(this),
      100 + t,
    );
    setTimeout(
      (() => {
        this.state.delete(i);
      }).bind(this),
      10_000 + t,
    );
  }

  error(message: string, timeout: number | null = null) {
    this.add_message({ status: "error", message }, timeout);
  }

  success(message: string, timeout: number | null = null) {
    this.add_message({ status: "success", message }, timeout);
  }

  warning(message: string, timeout: number | null = null) {
    this.add_message({ status: "warning", message }, timeout);
  }

  clear() {
    this.state.clear();
    this.trigger_subscribers();
  }
}

const toast: Toaster = new Toaster(5000);
export default toast;
