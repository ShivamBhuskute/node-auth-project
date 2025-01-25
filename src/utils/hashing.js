import bcrypt, { compare }  from "bcrypt";

const doHash = (value, saltValue) => {
    const result = bcrypt.hash(value, saltValue);
    return result;
};

const doHashValidation = (value, hashedValue) => {
    const result = compare(value, hashedValue);
    return result;
}

export { doHash, doHashValidation };
