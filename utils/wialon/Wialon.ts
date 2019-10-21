import axios from "axios";
import FormData from "form-data";

import {
	Params,
	Response,
	SVC,
	TokenLoginParams,
	TokenLoginResponse,
	WialonError
} from "./";
import { Core } from "./core";
import { Messages } from "./messages";
import { Unit } from "./unit";
import { Utils } from "./utils";

export const defaultHost = "https://hst-api.wialon.com";

export class Wialon {
	public static login = async (
		params: TokenLoginParams,
		host: string = defaultHost
	) => {
		const user = await Wialon.execute("token/login", params, null, host);
		const w = new Wialon(user, host);
		return w;
	};

	public static buildUrl = <T extends SVC>(
		url: string,
		svc: T,
		params?: Params[T] | null,
		sid?: string
	) => {
		let composedUrl = url;
		if (svc || params || sid) {
			let firstArg = true;
			const indexArg = composedUrl.length - 1;
			composedUrl += "?";
			if (svc) {
				firstArg = false;
				composedUrl += `svc${svc}`;
			}
			if (params) {
				firstArg = false;
				composedUrl += `&params=${JSON.stringify(params)}`;
			}
			if (sid) {
				firstArg = false;
				composedUrl += `sid=${sid}`;
			}
			if (!firstArg) {
				composedUrl.replace(new RegExp(`^(.{${indexArg}})(.)`), `$1\?$2`);
			}
		}
		return composedUrl;
	};

	public static execute = async <T extends SVC>(
		svc: T,
		params?: Params[T] | null,
		sid?: string | null,
		url: string = defaultHost
	): Promise<Response[T] | never> => {
		const formData = new FormData();
		if (params) {
			formData.append("params", JSON.stringify(params));
		}
		if (sid) {
			formData.append("sid", sid);
		}

		const res = await axios.post<Response[T]>(
			Wialon.buildUrl(url, svc),
			formData,
			{
				headers: { ...formData.getHeaders() },
				timeout: 0
			}
		);

		if (res.data.error) {
			throw new WialonError(res.data.error);
		}

		return res.data;
	};

	protected constructor(
		protected user: TokenLoginResponse,
		public host: string = defaultHost
	) {}

	public get Unit() {
		return new Unit(this.user, this.host);
	}

	public get Core() {
		return new Core(this.user, this.host);
	}

	public get Messages() {
		return new Messages(this.user, this.host);
	}

	public get Utils() {
		return new Utils(this.user, this.host);
	}
}