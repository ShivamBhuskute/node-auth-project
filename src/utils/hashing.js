import bcrypt, { compare }  from "bcrypt";
import crypto from "crypto"

const doHash = (value, saltValue) => {
    const result = bcrypt.hash(value, saltValue);
    return result;
};

const doHashValidation = (value, hashedValue) => {
    const result = compare(value, hashedValue);
    return result;
}

const hmacProcess = (value, key) => {
	const result = crypto.createHmac('sha256', key).update(value).digest('hex');
	return result;
};

export { doHash, doHashValidation, hmacProcess };
