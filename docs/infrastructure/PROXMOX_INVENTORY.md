# Current Proxmox inventory

Verified 2026-10-23T05:55:51.684930+00:00. Registry SHA-256: `ea84d7e9891fe6c3f8f2e66408a18457a12af20f2123ed475fd3238fef2d643c`.

This register supersedes obsolete operational guest IDs in older documents; historical receipts retain their original meaning.

| Role | Current guest | Node | Preserved service IP | Historical ID |
|---|---|---|---|---|
| Admin | CT401 | pve4 | 172.16.16.101 | CT101 |
| Cloud and portals | CT403 | pve4 | 172.16.16.119 | CT119 |
| Docker/web hosting | CT101 | pve | 172.16.16.117 | CT117 |
| Monitoring | CT301 | pve3 | 172.16.16.111 | see historical evidence |
| Backup server | CT303 | pve3 | 172.16.16.115 | CT115 |
| KES firewall | VM302 | pve3 | verify interface/VRRP identity | current live ID |
| CI runner | VM304 | pve3 | verify isolated network | current live ID |
| Datacenter Manager | VM306 | pve3 | verify live guest identity | occupied; not a staging slot |

## Complete guest inventory

| ID | Kind | Node | Current name | Observed state |
|---|---|---|---|---|
| 100 | qemu | pve | ai-node-01 | running |
| 101 | lxc | pve | docker-host | running |
| 103 | lxc | pve | claapp.com.ng | running |
| 105 | lxc | pve | bill.i.ng | running |
| 107 | lxc | pve | chatbot.myapps.com.ng | running |
| 200 | qemu | pve2 | ai-node-02 | running |
| 201 | lxc | pve2 | webmail.thelightville.net | running |
| 203 | lxc | pve2 | app.onlineradio.com.ng | running |
| 205 | lxc | pve2 | api.onlineradio.com.ng | running |
| 207 | lxc | pve2 | channel.onlineradio.com.ng | running |
| 209 | lxc | pve2 | commutiq | running |
| 211 | lxc | pve2 | smtp | running |
| 213 | lxc | pve2 | smtp-db | running |
| 215 | lxc | pve2 | agent-orch | running |
| 217 | lxc | pve2 | zammad | running |
| 219 | lxc | pve2 | pmg | running |
| 300 | qemu | pve3 | windows-workstation | running |
| 301 | lxc | pve3 | monitoring.thelightville.xyz | running |
| 302 | qemu | pve3 | kariya-kes-fw | running |
| 303 | lxc | pve3 | pbs.thelightville.xyz | running |
| 304 | qemu | pve3 | github-runner | running |
| 306 | qemu | pve3 | proxmox-datacenter-manager | running |
| 401 | lxc | pve4 | kariya-admin | running |
| 403 | lxc | pve4 | kariya-cloud | running |
| 404 | qemu | pve4 | KARIYA-DEV-01 | running |
| 406 | qemu | pve4 | KARIYA-TEST-01 | running |
| 408 | qemu | pve4 | KARIYA-KES-TEST-01 | running |
| 410 | qemu | pve4 | KARIYA-KEA-LINUX-TEST-01 | running |
| 414 | qemu | pve4 | KARIYA-TEST-VERIFIER-01 | stopped |
| 416 | lxc | pve4 | kariya-release-runner | running |
| 903 | lxc | pve4 | app.onlineradio.com.ng | stopped |
| 990203 | lxc | pve2 | php2shell-203-validation | stopped |
| 990208 | lxc | pve2 | php2shell-207-validation | stopped |

Service IPs, protected GitHub environments, runner labels, backup-directory names and concurrency locks are independent identities. Retained old-ID aliases must not be used as live Proxmox IDs. Inventory is a dated observation; verify type, node and identity before every mutation.

Temporary remediation guest: CT990421 on pve4 is an unprivileged isolated dependency builder, with onboot disabled. It is separate from production workload IDs.
