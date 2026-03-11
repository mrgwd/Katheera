import Image from "next/image";

export default function Logo() {
  return (
    <div>
      <Image src="/logo.png" alt="Logo" width={25} height={25} />
    </div>
  );
}
